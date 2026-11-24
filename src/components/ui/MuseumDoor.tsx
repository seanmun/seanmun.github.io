// File: src/components/ui/MuseumDoor.tsx
// Purpose: The way into the museum from the classic site. A doorway in the
// hero, ajar on the lobby; it swings open under the pointer, and a click
// grows the lobby out of the door until it is the whole screen.
'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LOBBY = '/media/museum/door.jpg';
// The museum's loading veil is this colour, so the door hands over to it
const VEIL = '#d9d5ce';
// How far the doorway is zoomed into the lobby still, and about where
const ZOOM = 1.45;

export function MuseumDoor({ className = '', onEnter }: { className?: string; onEnter?: () => void }) {
  const router = useRouter();
  const frame = useRef<HTMLSpanElement>(null);
  const view = useRef<HTMLSpanElement>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);

  // The stage lives on <body> so it outlasts this page: when the museum
  // takes over, its veil is already underneath and the stage lets go
  useEffect(() => () => {
    const el = stage.current;
    if (!el) return;
    stage.current = null;
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'forwards' })
      .finished.finally(() => el.remove());
  }, []);

  const enter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    onEnter?.();

    const door = frame.current;
    const opening = view.current;
    if (!door || !opening || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push('/museum');
      return;
    }

    door.classList.add('is-open');
    const from = opening.getBoundingClientRect();

    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed', zIndex: '60', overflow: 'hidden', background: '#1b1a18',
      top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px`,
    });
    const lobby = document.createElement('div');
    Object.assign(lobby.style, {
      position: 'absolute', inset: '0',
      background: `url(${LOBBY}) 50% 60% / cover no-repeat`,
      transformOrigin: '50% 62%', transform: `scale(${ZOOM})`,
    });
    const wash = document.createElement('div');
    Object.assign(wash.style, { position: 'absolute', inset: '0', background: VEIL, opacity: '0' });
    el.append(lobby, wash);
    document.body.appendChild(el);
    stage.current = el;

    // Let the leaves get out of the way first, then walk through
    const walk = { duration: 820, delay: 200, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' as const };
    const grow = el.animate(
      [
        { top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px` },
        { top: '0px', left: '0px', width: '100vw', height: '100vh' },
      ],
      walk
    );
    lobby.animate([{ transform: `scale(${ZOOM})` }, { transform: 'scale(1.04)' }], walk);

    grow.finished
      .then(() => wash.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-in', fill: 'forwards' }).finished)
      .catch(() => undefined)
      .then(() => router.push('/museum'));

    // If the museum never arrives, don't leave the visitor behind a curtain
    window.setTimeout(() => {
      if (stage.current !== el) return;
      stage.current = null;
      el.remove();
      door.classList.remove('is-open');
      busy.current = false;
    }, 12000);
  };

  return (
    <Link
      href="/museum"
      prefetch={false}
      onClick={enter}
      onPointerEnter={() => router.prefetch('/museum')}
      aria-label="Enter the 3D museum"
      className={`museum-door ${className}`}
    >
      <span ref={frame} className="museum-door-frame">
        <span ref={view} className="museum-door-view">
          <span className="museum-door-lobby" style={{ backgroundImage: `url(${LOBBY})` }} />
        </span>
        <span className="museum-door-leaf museum-door-leaf-l" />
        <span className="museum-door-leaf museum-door-leaf-r" />
      </span>
      <span className="museum-door-label">
        <span className="museum-door-name">Museum</span>
        <span className="museum-door-cue">Walk in&nbsp;→</span>
      </span>
    </Link>
  );
}
