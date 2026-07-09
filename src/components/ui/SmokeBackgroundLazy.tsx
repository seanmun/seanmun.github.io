'use client';
// File: src/components/ui/SmokeBackgroundLazy.tsx
// Purpose: Gate for the smoke background. Mobile devices never download the
// simulation code at all (it lives in its own chunk via next/dynamic), and
// desktop defers fetching it until the browser is idle so the effect can
// never slow down initial page load.

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SmokeBackground = dynamic(
  () => import('./SmokeBackground').then((m) => m.SmokeBackground),
  { ssr: false }
);

const isMobile = () =>
  window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

export function SmokeBackgroundLazy() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (isMobile()) return;

    // Wait for idle so the smoke chunk never competes with page load
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

  return enabled ? <SmokeBackground /> : null;
}
