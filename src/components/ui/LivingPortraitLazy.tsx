'use client';
// File: src/components/ui/LivingPortraitLazy.tsx
// Purpose: Loads the 3D portrait after the page is idle. Until then (and if
// WebGL is unavailable) the flat photo underneath shows as normal.

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDeferredMount } from '@/hooks/useDeferredMount';

const LivingPortrait = dynamic(() => import('./LivingPortrait').then((m) => m.LivingPortrait), { ssr: false });

export function LivingPortraitLazy({ className = '' }: { className?: string }) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const enabled = useDeferredMount(placeholderRef);

  return enabled ? <LivingPortrait className={className} /> : <div ref={placeholderRef} className="hidden" aria-hidden="true" />;
}
