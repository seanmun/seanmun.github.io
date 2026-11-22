'use client';
// File: src/components/museum/ProgressRail.tsx
// Purpose: Where you are in the museum. One segment per room, sized by its
// number of stops, filling as you walk. Desktop: a vertical rail down the
// left edge with each room's name beside it; click a name (or its segment)
// to walk straight there. Phones: a thin horizontal bar along the top edge.
// The fill follows the scroll through a CSS variable (--p, in stops), set
// straight on the element, so scrolling never re-renders React.

import React, { useEffect, useMemo, useRef } from 'react';
import { STEP } from './layout';

type Props = {
  groups: { name: string; first: number }[];
  total: number; // stops
  current: string; // the room you're in
  narrow: boolean;
  onGo: (stop: number) => void;
};

// A soft dark edge, so the white fill reads on pale walls as well as dark ones
const OUTLINE = 'drop-shadow(0 0 1.5px rgba(0,0,0,0.55))';

export function ProgressRail({ groups, total, current, narrow, onGo }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      ref.current?.style.setProperty('--p', String(window.scrollY / (STEP * window.innerHeight)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Each room runs from its first stop to the next room's first (the last
  // room, to the last stop); its segment is full once you reach the next
  const segs = useMemo(() => groups.map((g, i) => {
    const end = i + 1 < groups.length ? groups[i + 1].first : total - 1;
    return { ...g, n: Math.max(1, end - g.first) };
  }), [groups, total]);

  const fill = (s: { first: number; n: number }) =>
    `clamp(0, calc((var(--p, 0) - ${s.first}) / ${s.n}), 1)`;

  if (narrow) {
    return (
      <nav ref={ref} aria-label="Progress through the museum" className="fixed top-0 inset-x-0 z-20 flex gap-[3px] px-[3px] pt-[3px] pointer-events-none">
        {segs.map((s) => (
          <div key={s.name} className="h-[3px] rounded-full bg-black/30 overflow-hidden" style={{ flexGrow: s.n, flexBasis: 0, filter: OUTLINE }}>
            <div className="h-full w-full bg-white origin-left" style={{ transform: `scaleX(${fill(s)})` }} />
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav ref={ref} aria-label="Rooms" className="fixed left-5 top-1/2 -translate-y-1/2 z-20 h-[58vh] flex flex-col gap-1.5">
      {segs.map((s) => {
        const here = s.name === current;
        return (
          <button
            key={s.name}
            onClick={() => onGo(s.first)}
            aria-current={here ? 'location' : undefined}
            className="group flex items-start gap-3 min-h-[22px] text-left"
            style={{ flexGrow: s.n, flexBasis: 0 }}
          >
            <span className="relative w-[3px] self-stretch rounded-full bg-black/30 overflow-hidden shrink-0" style={{ filter: OUTLINE }}>
              <span className="absolute inset-0 bg-white origin-top" style={{ transform: `scaleY(${fill(s)})` }} />
            </span>
            <span
              className={`-mt-[3px] rounded-full px-2 py-0.5 text-[11px] leading-4 tracking-wide whitespace-nowrap backdrop-blur transition ${
                here ? 'bg-black/60 text-white' : 'bg-black/25 text-white/70 group-hover:bg-black/55 group-hover:text-white'
              }`}
            >
              {s.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
