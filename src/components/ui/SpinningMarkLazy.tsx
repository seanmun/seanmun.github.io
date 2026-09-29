'use client';
// File: src/components/ui/SpinningMarkLazy.tsx
// Purpose: Keeps three.js and the 1MB model out of the initial page load.
// The box is reserved immediately (no layout shift); the 3D code is fetched
// once the browser is idle — or, with whenVisible, only once the box scrolls
// near the viewport (the footer signature: most visitors never get there).
// A second instance reuses the model from the browser's HTTP cache.

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const SpinningMark = dynamic(() => import('./SpinningMark').then((m) => m.SpinningMark), { ssr: false });

export function SpinningMarkLazy({
  className = '',
  decorative = false,
  whenVisible = false,
}: {
  className?: string;
  decorative?: boolean;
  whenVisible?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (whenVisible) {
      const box = placeholderRef.current;
      if (!box) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEnabled(true);
            observer.disconnect();
          }
        },
        { rootMargin: '300px' }
      );
      observer.observe(box);
      return () => observer.disconnect();
    }

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const enable = () => setEnabled(true);
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(enable, 400);
    }
    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [whenVisible]);

  return enabled ? (
    <SpinningMark className={className} decorative={decorative} />
  ) : (
    <div ref={placeholderRef} className={className} aria-hidden="true" />
  );
}
