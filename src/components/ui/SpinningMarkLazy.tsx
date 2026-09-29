'use client';
// File: src/components/ui/SpinningMarkLazy.tsx
// Purpose: Keeps three.js and the 1MB model out of the initial page load.
// The box is reserved immediately (no layout shift); the 3D code is fetched
// once the browser is idle.

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SpinningMark = dynamic(() => import('./SpinningMark').then((m) => m.SpinningMark), { ssr: false });

export function SpinningMarkLazy({ className = '' }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
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
  }, []);

  return enabled ? <SpinningMark className={className} /> : <div className={className} aria-hidden="true" />;
}
