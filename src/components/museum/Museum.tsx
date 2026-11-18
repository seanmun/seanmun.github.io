'use client';
// File: src/components/museum/Museum.tsx
// Purpose: The /museum page. A fixed WebGL canvas with a tall scroll track
// over it: one screen of scrolling per station. The HTML layer carries
// everything people read (captions, the room map, project placards), so
// the words stay crisp, accessible and selectable.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { STEP, buildStations, type MuseumProject, type PanelContent } from './layout';
import type { MuseumHandle } from './engine';

export default function Museum({ projects, ordinals, tours }: { projects: MuseumProject[]; ordinals: string[]; tours: Record<string, PanelContent[]> }) {
  const stations = useMemo(() => buildStations(projects, tours), [projects, tours]);
  // One container per hologram panel: React renders into it, the engine
  // places it in the room
  const panels = useMemo(() => stations.flatMap((st, i) => {
    if (st.panel === undefined || !st.slug) return [];
    const content = tours[st.slug]?.[st.panel];
    if (!content) return [];
    const element = document.createElement('div');
    element.className = 'holo-wrap';
    element.dataset.on = '0';
    return [{ station: i, element, content }];
  }), [stations, tours]);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MuseumHandle | null>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState({ loaded: 0, total: 1 });
  const [failed, setFailed] = useState(false);
  const [placard, setPlacard] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    import('./engine').then(({ createMuseum }) => {
      if (disposed) return;
      try {
        engineRef.current = createMuseum(host, {
          stations,
          projects,
          ordinals,
          panels: panels.map(({ station, element }) => ({ station, element })),
          reduceMotion,
          onPlacard: (slug) => setPlacard(slug),
          onProgress: (loaded, total) => setProgress({ loaded, total }),
        });
        engineRef.current.setScroll(window.scrollY / (STEP * window.innerHeight));
      } catch (err) {
        console.error('Museum failed to start:', err);
        setFailed(true);
      }
    });
    // When scrolling goes idle (after any wheel or touch momentum), glide to
    // the nearest stop, so the view never rests mid-turn facing a corner.
    let settle = 0;
    let restedAt = Math.round(window.scrollY / (STEP * window.innerHeight));
    const onScroll = () => {
      const s = window.scrollY / (STEP * window.innerHeight);
      engineRef.current?.setScroll(s);
      setActive(Math.min(stations.length - 1, Math.max(0, Math.round(s))));
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const now = window.scrollY / (STEP * window.innerHeight);
        // A deliberate nudge (over a tenth of a stop) carries on in that
        // direction; anything smaller eases back
        const moved = now - restedAt;
        const target = Math.abs(moved) < 0.1 ? restedAt
          : Math.min(stations.length - 1, Math.max(0, moved > 0 ? Math.ceil(now - 0.02) : Math.floor(now + 0.02)));
        restedAt = target;
        if (Math.abs(now - target) > 0.01) {
          window.scrollTo({ top: target * STEP * window.innerHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }, 260);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      disposed = true;
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [stations, projects, ordinals, panels]);

  const goTo = useCallback((i: number) => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: i * STEP * window.innerHeight, behavior: smooth ? 'smooth' : 'auto' });
    setMapOpen(false);
  }, []);

  useEffect(() => {
    if (!placard) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPlacard(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placard]);

  const station = stations[active];
  const groups = useMemo(() => {
    const out: { name: string; first: number }[] = [];
    stations.forEach((s, i) => { if (!out.some((g) => g.name === s.group)) out.push({ name: s.group, first: i }); });
    return out;
  }, [stations]);
  const project = placard ? projects.find((p) => p.slug === placard) : null;
  const loading = progress.loaded < progress.total;

  return (
    <div className="bg-[#d9d5ce] text-[#1d1c1a]">
      <div ref={hostRef} className="fixed inset-0" />
      {panels.map((p) => createPortal(<Hologram content={p.content} />, p.element, `holo-${p.station}`))}

      {/* Scroll track: STEP screens between stations */}
      <div style={{ height: `${((stations.length - 1) * STEP + 1) * 100}vh` }} />

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 pointer-events-none">
        <Link href="/" className="pointer-events-auto text-sm tracking-[0.25em] uppercase font-light text-white mix-blend-difference">
          Sean Munley
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setMapOpen((o) => !o)}
            aria-expanded={mapOpen}
            className="rounded-full bg-black/55 backdrop-blur px-4 py-2 text-xs uppercase tracking-widest text-white hover:bg-black/70"
          >
            Rooms
          </button>
          <Link href="/" className="rounded-full bg-white/75 backdrop-blur px-4 py-2 text-xs uppercase tracking-widest text-black hover:bg-white">
            Classic site
          </Link>
        </div>
      </header>

      {/* Room map */}
      {mapOpen && (
        <nav aria-label="Museum rooms" className="fixed top-16 right-4 sm:right-6 z-20 w-64 rounded-2xl bg-black/75 backdrop-blur p-3 text-white">
          <ol className="space-y-0.5">
            {groups.map((g) => {
              const here = station.group === g.name;
              return (
                <li key={g.name}>
                  <button
                    onClick={() => goTo(g.first)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm ${here ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    aria-current={here ? 'location' : undefined}
                  >
                    {g.name}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Caption for the current stop */}
      <div className={`fixed bottom-0 inset-x-0 z-10 px-4 pb-6 sm:pb-8 flex justify-center pointer-events-none transition-opacity duration-300 ${station.panel !== undefined ? 'opacity-0' : ''}`} aria-hidden={station.panel !== undefined}>
        <div
          key={station.id}
          className="pointer-events-auto max-w-xl w-full rounded-2xl bg-black/55 backdrop-blur px-5 py-4 text-white shadow-2xl animate-[museumIn_.5s_ease-out]"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-lg sm:text-xl font-semibold">{station.label}</h1>
            <span className="text-[11px] uppercase tracking-widest text-white/50 shrink-0">
              {active + 1} / {stations.length}
            </span>
          </div>
          {station.artist && <p className="text-sm text-white/90 mt-0.5">by {station.artist}</p>}
          <p className="text-sm text-white/75 mt-1">{station.sub}</p>
          {station.slug && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setPlacard(station.slug!)} className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-medium hover:bg-white/85">
                Read the placard
              </button>
              <Link href={`/projects/${station.slug}`} className="rounded-full border border-white/40 px-4 py-1.5 text-sm hover:bg-white/10">
                Case study →
              </Link>
            </div>
          )}
          {active === 0 && <p className="text-xs text-white/50 mt-2">Scroll, swipe, or use the arrow keys.</p>}
        </div>
      </div>

      {/* Loading veil */}
      {(loading || failed) && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#d9d5ce] transition-opacity">
          <p className="text-xs uppercase tracking-[0.4em] text-[#3b3935]">
            {failed ? 'This browser can’t open the museum' : 'Opening the museum'}
          </p>
          {failed ? (
            <Link href="/" className="mt-4 underline text-sm">Go to the classic site</Link>
          ) : (
            <div className="mt-4 h-px w-48 bg-black/10 overflow-hidden">
              <div className="h-full bg-black/60 transition-all" style={{ width: `${(progress.loaded / Math.max(1, progress.total)) * 100}%` }} />
            </div>
          )}
        </div>
      )}

      {/* The placard */}
      {project && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={() => setPlacard(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="placard-title"
            className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#fbfaf7] text-[#1d1c1a] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a857c]">{project.status}</p>
                <h2 id="placard-title" className="text-2xl font-semibold mt-1">{project.title}</h2>
                <div className="h-0.5 w-10 bg-[#1d1c1a] mt-3" />
              </div>
              <button onClick={() => setPlacard(null)} aria-label="Close placard" className="text-2xl leading-none text-[#8a857c] hover:text-black" autoFocus>
                ×
              </button>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-[#3d3a35]">{project.description}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {project.techStack.map((t) => (
                <li key={t} className="rounded-full bg-black/5 px-2.5 py-1 text-xs text-[#4d4a44]">{t}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`/projects/${project.slug}`} className="rounded-full bg-[#1d1c1a] text-white px-5 py-2 text-sm font-medium hover:bg-black">
                Read the case study
              </Link>
              {project.link && (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="rounded-full border border-black/20 px-5 py-2 text-sm hover:bg-black/5">
                  Visit the site ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes museumIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
${HOLO_CSS}`}</style>
    </div>
  );
}

// ---------- hologram panel ----------

function Hologram({ content: c }: { content: PanelContent }) {
  return (
    <section className="holo" aria-label={c.title}>
      <p className="holo-kicker">{c.kicker}</p>
      <h2 className="holo-title">{c.title}</h2>
      {c.body && <p className="holo-body">{c.body}</p>}
      {c.bullets.length > 0 && (
        <ul className="holo-list">
          {c.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      {c.stats.length > 0 && (
        <dl className="holo-stats">
          {c.stats.map((s) => (
            <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
          ))}
        </dl>
      )}
      {c.chips.length > 0 && (
        <ul className="holo-chips">
          {c.chips.map((ch) => <li key={ch}>{ch}</li>)}
        </ul>
      )}
      {c.links.length > 0 && (
        <div className="holo-links">
          {c.links.map((l, i) => l.external ? (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={i === 0 ? 'primary' : ''}>{l.label} ↗</a>
          ) : (
            <Link key={l.href} href={l.href} className={i === 0 ? 'primary' : ''}>{l.label} →</Link>
          ))}
        </div>
      )}
    </section>
  );
}

// Light, cyan, a little unstable: projected light, not a UI card
const HOLO_CSS = `
.holo-wrap { width: 560px; }
.holo {
  position: relative; overflow: hidden; padding: 26px 30px 28px; border-radius: 16px;
  color: #e4fbff; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: linear-gradient(180deg, rgba(14,70,110,0.80) 0%, rgba(6,36,66,0.82) 60%, rgba(4,26,52,0.86) 100%);
  border: 1px solid rgba(140,225,255,0.65);
  box-shadow: 0 0 28px rgba(80,200,255,0.45), inset 0 0 40px rgba(80,200,255,0.16);
  text-shadow: 0 0 10px rgba(120,220,255,0.55);
  opacity: 0; transition: opacity .35s ease;
}
.holo::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(200,245,255,0.07) 0 1px, transparent 1px 4px);
  animation: holoScan 6s linear infinite;
}
.holo::after {
  content: ""; position: absolute; left: 0; right: 0; top: -30%; height: 30%; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(170,240,255,0.12), transparent);
  animation: holoSweep 4.5s ease-in-out infinite;
}
.holo-wrap[data-on="1"] .holo { animation: holoIn .8s ease-out forwards; }
.holo-kicker { font-size: 12px; letter-spacing: .28em; text-transform: uppercase; color: rgba(170,235,255,0.75); margin: 0 0 10px; }
.holo-title { font-size: 30px; line-height: 1.12; font-weight: 600; margin: 0 0 12px; color: #fff; }
.holo-body { font-size: 17px; line-height: 1.5; margin: 0; color: rgba(228,250,255,0.92); }
.holo-list { margin: 14px 0 0; padding: 0; list-style: none; }
.holo-list li { position: relative; padding-left: 18px; font-size: 15px; line-height: 1.45; margin-top: 7px; color: rgba(228,250,255,0.88); }
.holo-list li::before { content: ""; position: absolute; left: 0; top: .6em; width: 7px; height: 7px; border-radius: 50%; background: #7fe3ff; box-shadow: 0 0 8px #7fe3ff; }
.holo-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0 0; }
.holo-stats div { border: 1px solid rgba(140,225,255,0.4); border-radius: 10px; padding: 10px 12px; background: rgba(80,200,255,0.08); }
.holo-stats dt { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: rgba(170,235,255,0.7); }
.holo-stats dd { margin: 4px 0 0; font-size: 26px; font-weight: 600; color: #fff; }
.holo-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 0; padding: 0; list-style: none; }
.holo-chips li { font-size: 13px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(140,225,255,0.45); background: rgba(80,200,255,0.1); }
.holo-chips li:first-child { background: rgba(80,255,170,0.18); border-color: rgba(120,255,190,0.6); }
.holo-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.holo-links a { font-size: 15px; padding: 8px 15px; border-radius: 999px; border: 1px solid rgba(140,225,255,0.6); color: #e4fbff; text-decoration: none; text-shadow: none; }
.holo-links a:hover { background: rgba(120,220,255,0.18); }
.holo-links a.primary { background: rgba(140,230,255,0.9); color: #04202e; border-color: transparent; font-weight: 600; }
@keyframes holoIn {
  0% { opacity: 0; clip-path: inset(49% 0 49% 0); }
  25% { opacity: .9; clip-path: inset(30% 0 30% 0); }
  35% { opacity: .35; }
  50% { opacity: 1; clip-path: inset(0 0 0 0); }
  62% { opacity: .75; }
  100% { opacity: 1; clip-path: inset(0 0 0 0); }
}
@keyframes holoScan { from { background-position: 0 0; } to { background-position: 0 40px; } }
@keyframes holoSweep { 0%, 15% { top: -30%; } 85%, 100% { top: 110%; } }
@media (prefers-reduced-motion: reduce) {
  .holo-wrap[data-on="1"] .holo { animation: none; opacity: 1; }
  .holo::before, .holo::after { animation: none; }
}
`;
