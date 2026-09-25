// src/lib/track-utils.ts
// Events are posted to /api/track, which writes them with the Admin SDK.
// The browser no longer talks to Firestore, so the database can deny all
// client access. Sends are fire-and-forget: tracking must never block a
// click or delay navigation.

export type TrackEvent = {
  cookieId: string;
  eventType: 'pageview' | 'project_click' | 'modal_open' | 'link_click' | 'click';
  timestamp?: Date; // set server-side; kept for call-site compatibility
  path?: string;
  projectName?: string;
  modalName?: string;
  linkName?: string;
  linkUrl?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string; // read from the request server-side
  referrer?: string;
  timeOnSite?: number; // in seconds
  // 'click' events (see ClickTracker): what was clicked and where
  label?: string;
  elementKind?: string;
  section?: string;
  href?: string;
  xPercent?: number;
  yPercent?: number;
}

// Stable per-browser id, shared with the rest of the tracking
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem('visitorId');
    if (existing) return existing;
    const created = Math.random().toString(36).substring(2);
    localStorage.setItem('visitorId', created);
    return created;
  } catch {
    return '';
  }
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(userAgent));

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

// keepalive lets the request outlive the page, so events sent while the
// visitor is leaving still arrive
function send(event: TrackEvent) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    ...event,
    path: event.path ?? window.location.pathname,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      return;
    }
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics surface an error to a visitor
  }
}

// Several events in one request — the click tracker buffers and flushes
export function sendEvents(events: TrackEvent[]) {
  if (typeof window === 'undefined' || events.length === 0) return;

  const payload = JSON.stringify({
    events: events.map((event) => ({
      ...event,
      path: event.path ?? window.location.pathname,
    })),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      return;
    }
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics surface an error to a visitor
  }
}

export async function trackEvent(event: TrackEvent) {
  send(event);
  return { success: true };
}

// Helper function to track modal opens
export async function trackModalOpen(cookieId: string, modalName: string) {
  if (!cookieId) return;
  send({
    cookieId,
    eventType: 'modal_open',
    modalName,
    deviceType: getDeviceType(),
  });
}

// Helper function to track link clicks — sendBeacon hands the event to the
// browser and returns immediately, so navigation is never delayed (the old
// Firestore version blocked clicks on mobile)
export function trackLinkClick(cookieId: string, linkName: string, linkUrl: string) {
  if (!cookieId) return;
  send({
    cookieId,
    eventType: 'link_click',
    linkName,
    linkUrl,
    deviceType: getDeviceType(),
  });
}
