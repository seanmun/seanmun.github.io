'use client';
// File: src/components/ui/SpinningMarkLazy.tsx
// Purpose: Keeps three.js and the 1MB model out of the initial page load.
// The box is reserved immediately (no layout shift); the 3D code is fetched
// once the browser is idle — or, with whenVisible, only once the box scrolls
// near the viewport (the footer signature: most visitors never get there).
// A second instance reuses the model from the browser's HTTP cache.

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDeferredMount } from '@/hooks/useDeferredMount';

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
  const placeholderRef = useRef<HTMLDivElement>(null);
  const enabled = useDeferredMount(placeholderRef, whenVisible);

  return enabled ? (
    <SpinningMark className={className} decorative={decorative} />
  ) : (
    <div ref={placeholderRef} className={className} aria-hidden="true" />
  );
}
