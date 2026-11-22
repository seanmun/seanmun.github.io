// File: src/components/museum/tracking.ts
// Purpose: What the museum tells the site's analytics. Clicks on HTML (the
// rail, the Rooms menu, card links) are already caught by ClickTracker,
// labelled by their data-track attributes. This adds what a click tracker
// can't see:
// - arrival: a pageview for /museum, with where the visitor came from
// - progress: each stop a visitor settles on, once per visit, with the room,
//   how far through the tour it is, the seconds since they arrived and how
//   they got there (scroll, the rail or the Rooms menu). Their furthest stop
//   is where they dropped off.
// - picks: clicks on things in the 3D scene (a screen, a placard)
// Events are buffered and sent together, like ClickTracker's, and flushed
// when the page is hidden. Nothing about the person beyond the site's usual
// anonymous visitor id.

import { getDeviceType, getVisitorId, sendEvents, type TrackEvent } from '@/lib/track-utils';

export type Via = 'scroll' | 'rail' | 'rooms';

const FLUSH_MS = 5000;
let arrived = false; // one pageview per page load (dev mounts effects twice)

export function museumTracker(totalStops: number) {
  const started = performance.now();
  const seen = new Set<string>();
  let buffer: TrackEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (buffer.length) { sendEvents(buffer); buffer = []; }
  };
  const push = (event: Omit<TrackEvent, 'cookieId'>) => {
    const cookieId = getVisitorId();
    if (!cookieId) return;
    buffer.push({ cookieId, deviceType: getDeviceType(), path: '/museum', ...event });
    if (!timer) timer = setTimeout(flush, FLUSH_MS);
  };
  const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flush);

  if (!arrived) {
    arrived = true;
    push({ eventType: 'pageview', referrer: document.referrer || undefined });
  }

  return {
    // The visitor has settled on a stop
    stop(index: number, id: string, room: string, via: Via) {
      if (seen.has(id)) return;
      seen.add(id);
      push({
        eventType: 'museum_progress',
        label: id,
        section: room,
        xPercent: Math.round((100 * index) / Math.max(1, totalStops - 1)),
        elementKind: via,
        timeOnSite: Math.max(1, Math.round((performance.now() - started) / 1000)),
      });
    },
    // A click on something in the 3D scene
    pick(what: string) {
      push({ eventType: 'click', label: `Museum 3D: ${what}`.slice(0, 60), elementKind: '3d' });
    },
    dispose() {
      flush();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    },
  };
}
