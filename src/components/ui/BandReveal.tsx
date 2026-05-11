'use client';
import React, { useEffect, useState } from 'react';

interface BandRevealProps {
  children: React.ReactNode;
  sessionKey?: string;
  numBands?: number;
  className?: string;
}

export function BandReveal({
  children,
  sessionKey = 'band-reveal',
  numBands = 14,
  className = '',
}: BandRevealProps) {
  const [phase, setPhase] = useState<'pending' | 'animating' | 'done'>('pending');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhase('done');
      return;
    }
    setPhase('animating');
    const TOTAL = 1815;
    const t = setTimeout(() => setPhase('done'), TOTAL + 80);
    return () => clearTimeout(t);
  }, [sessionKey]);

  const animating = phase === 'animating';

  return (
    <div className={`band-reveal-root relative ${className}`}>
      <div className={`w-full h-full ${animating ? 'band-reveal-content' : ''}`}>{children}</div>
      {animating && (
        <div className="band-reveal-strips" aria-hidden="true">
          {Array.from({ length: numBands }).map((_, i) => (
            <span
              key={i}
              className={`band-reveal-strip ${i % 2 === 0 ? 'up' : 'down'}`}
              style={{
                left: `calc(${(i / numBands) * 100}% - 0.5px)`,
                width: `calc(${100 / numBands}% + 1px)`,
                animationDelay: `${i * 55}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
