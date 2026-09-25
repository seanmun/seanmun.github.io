'use client';
// File: src/components/ClickTracker.tsx
// Purpose: Records every click on the page from one delegated listener.
// Clicks are buffered and flushed together, so a busy visitor costs a couple
// of requests rather than dozens. Nothing a visitor types is ever captured —
// only what they clicked on.

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getDeviceType, getVisitorId, sendEvents, TrackEvent } from '@/lib/track-utils';

const FLUSH_MS = 5000;
const MAX_BUFFER = 25;
const MAX_LABEL = 60;

// What did they click? Prefer an explicit data-track label, then the
// accessible name, then visible text, then the element itself.
function describe(target: HTMLElement) {
  const tagged = target.closest<HTMLElement>('[data-track]');
  if (tagged?.dataset.track) return tagged.dataset.track.slice(0, MAX_LABEL);

  const interactive = target.closest<HTMLElement>(
    'a, button, [role="button"], input, select, textarea, summary'
  );
  const el = interactive ?? target;

  const label =
    el.getAttribute('aria-label') ??
    el.getAttribute('title') ??
    (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      ? // deliberately not el.value — never capture what someone typed
        el.getAttribute('placeholder') ?? `${el.tagName.toLowerCase()} field`
      : el.textContent?.replace(/\s+/g, ' ').trim()) ??
    '';

  return (label || el.tagName.toLowerCase()).slice(0, MAX_LABEL);
}

function kindOf(target: HTMLElement) {
  const el = target.closest<HTMLElement>('a, button, [role="button"], input, select, textarea');
  if (!el) return 'other';
  if (el instanceof HTMLAnchorElement) return 'link';
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return 'field';
  return el.tagName.toLowerCase() === 'button' || el.getAttribute('role') === 'button'
    ? 'button'
    : 'other';
}

export function ClickTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // The dashboard shouldn't pollute its own numbers
    if (pathname?.startsWith('/dashboard')) return;

    let buffer: TrackEvent[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (buffer.length === 0) return;
      sendEvents(buffer);
      buffer = [];
    };

    // Capture phase: components that call stopPropagation (the project cards
    // do) would otherwise hide their clicks from us
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLElement)) return;

      const cookieId = getVisitorId();
      if (!cookieId) return;

      const link = target.closest('a');
      const section = target.closest<HTMLElement>('[id]')?.id;

      buffer.push({
        cookieId,
        eventType: 'click',
        path: window.location.pathname,
        label: describe(target),
        elementKind: kindOf(target),
        section: section ? section.slice(0, 60) : undefined,
        href: link?.getAttribute('href')?.slice(0, 300) ?? undefined,
        // Viewport-relative position, so this can drive a heatmap later
        xPercent: Math.round((event.clientX / window.innerWidth) * 100),
        yPercent: Math.round((event.clientY / window.innerHeight) * 100),
        deviceType: getDeviceType(),
      });

      if (buffer.length >= MAX_BUFFER) flush();
      else if (!timer) timer = setTimeout(flush, FLUSH_MS);
    };

    // Send whatever is buffered before the page goes away
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('click', onClick, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);

    return () => {
      flush();
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

  return null;
}
