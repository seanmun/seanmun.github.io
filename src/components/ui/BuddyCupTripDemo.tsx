'use client';
// File: src/components/ui/BuddyCupTripDemo.tsx
// Purpose: A sample Buddy Cup trip, explorable by day: the cup score through
// that day, each match with its result (or live status), and every player's
// net score for the round. The real trip pages are login-gated, so this is
// sample data shaped like the Pinehurst Cup (two teams of six, 2v2 match
// play Wed–Fri, singles Saturday). Styled like the app — dark in every site
// theme — and built from HTML so it stays legible at every width.

import React, { useRef, useState } from 'react';

type Team = 'H' | 'C';
const TEAM = {
  H: { name: 'Hacks', color: '#22c55e' },
  C: { name: 'Chunkers', color: '#eab308' },
} as const;

const HCP: Record<string, number> = {
  Ian: 10.4, Munley: 24.5, Andy: 16.0, Carty: 13.2, Truant: 16.9, Fran: 14.8,
  Dan: 11.2, Lusty: 16.2, Marino: 11.8, Kyle: 15.5, Musket: 22.1, Mallon: 25.1,
};
const TEAM_OF: Record<string, Team> = {
  Ian: 'H', Munley: 'H', Andy: 'H', Carty: 'H', Truant: 'H', Fran: 'H',
  Dan: 'C', Lusty: 'C', Marino: 'C', Kyle: 'C', Musket: 'C', Mallon: 'C',
};

interface Match {
  tee: string;
  hacks: string[];
  chunkers: string[];
  // Final: winner (or null for halved) + margin. Live: leader + status text.
  final?: { winner: Team | null; margin: string };
  live?: { leader: Team | null; status: string };
}

interface Score {
  player: string;
  gross?: number; // finished rounds
  toPar?: number; // net to par: computed for finished rounds, given for live ones
  thru?: number; // live rounds
}

interface Day {
  tab: string;
  date: string;
  course: string;
  par: number;
  format: string;
  matches: Match[];
  scores: Score[];
}

const DAYS: Day[] = [
  {
    tab: 'Wed', date: 'Aug 19', course: 'Pine Needles', par: 71, format: '2v2 match play',
    matches: [
      { tee: '2:30 PM', hacks: ['Andy', 'Carty'], chunkers: ['Mallon', 'Musket'], final: { winner: 'C', margin: '2&1' } },
      { tee: '2:40 PM', hacks: ['Truant', 'Fran'], chunkers: ['Marino', 'Dan'], final: { winner: 'H', margin: '1 UP' } },
      { tee: '2:50 PM', hacks: ['Ian', 'Munley'], chunkers: ['Lusty', 'Kyle'], final: { winner: null, margin: 'AS' } },
    ],
    scores: [
      { player: 'Mallon', gross: 96 }, { player: 'Musket', gross: 95 }, { player: 'Andy', gross: 90 }, { player: 'Carty', gross: 86 },
      { player: 'Truant', gross: 88 }, { player: 'Fran', gross: 87 }, { player: 'Marino', gross: 84 }, { player: 'Dan', gross: 83 },
      { player: 'Ian', gross: 81 }, { player: 'Munley', gross: 97 }, { player: 'Lusty', gross: 87 }, { player: 'Kyle', gross: 89 },
    ],
  },
  {
    tab: 'Thu', date: 'Aug 20', course: 'Tobacco Road', par: 71, format: '2v2 match play',
    matches: [
      { tee: '8:00 AM', hacks: ['Ian', 'Carty'], chunkers: ['Mallon', 'Dan'], final: { winner: 'H', margin: '4&3' } },
      { tee: '8:12 AM', hacks: ['Truant', 'Munley'], chunkers: ['Marino', 'Kyle'], final: { winner: 'C', margin: '3&2' } },
      { tee: '8:25 AM', hacks: ['Andy', 'Fran'], chunkers: ['Musket', 'Lusty'], final: { winner: 'H', margin: '2 UP' } },
    ],
    scores: [
      { player: 'Ian', gross: 79 }, { player: 'Carty', gross: 85 }, { player: 'Mallon', gross: 99 }, { player: 'Dan', gross: 85 },
      { player: 'Truant', gross: 90 }, { player: 'Munley', gross: 99 }, { player: 'Marino', gross: 81 }, { player: 'Kyle', gross: 88 },
      { player: 'Andy', gross: 85 }, { player: 'Fran', gross: 88 }, { player: 'Musket', gross: 94 }, { player: 'Lusty', gross: 88 },
    ],
  },
  {
    tab: 'Fri', date: 'Aug 21', course: 'Pinehurst No. 2', par: 72, format: '2v2 match play',
    matches: [
      { tee: '7:00 AM', hacks: ['Ian', 'Truant'], chunkers: ['Kyle', 'Musket'], final: { winner: 'H', margin: '1 UP' } },
      { tee: '7:10 AM', hacks: ['Andy', 'Munley'], chunkers: ['Dan', 'Lusty'], final: { winner: 'C', margin: '5&4' } },
      { tee: '7:20 AM', hacks: ['Carty', 'Fran'], chunkers: ['Marino', 'Mallon'], final: { winner: 'H', margin: '3&1' } },
    ],
    scores: [
      { player: 'Ian', gross: 82 }, { player: 'Truant', gross: 89 }, { player: 'Kyle', gross: 89 }, { player: 'Musket', gross: 95 },
      { player: 'Andy', gross: 93 }, { player: 'Munley', gross: 100 }, { player: 'Dan', gross: 80 }, { player: 'Lusty', gross: 91 },
      { player: 'Carty', gross: 83 }, { player: 'Fran', gross: 89 }, { player: 'Marino', gross: 86 }, { player: 'Mallon', gross: 98 },
    ],
  },
  {
    tab: 'Sat', date: 'Aug 22', course: 'Pinehurst No. 4', par: 72, format: 'Singles · live',
    matches: [
      { tee: '7:24 AM', hacks: ['Ian'], chunkers: ['Dan'], final: { winner: 'H', margin: '2&1' } },
      { tee: '7:24 AM', hacks: ['Munley'], chunkers: ['Mallon'], final: { winner: 'C', margin: '1 UP' } },
      { tee: '7:36 AM', hacks: ['Andy'], chunkers: ['Kyle'], live: { leader: 'C', status: '1 UP thru 15' } },
      { tee: '7:36 AM', hacks: ['Carty'], chunkers: ['Marino'], live: { leader: 'H', status: 'DORMIE · 3 UP thru 15' } },
      { tee: '7:48 AM', hacks: ['Truant'], chunkers: ['Lusty'], live: { leader: null, status: 'AS thru 12' } },
      { tee: '7:48 AM', hacks: ['Fran'], chunkers: ['Musket'], live: { leader: 'H', status: '2 UP thru 10' } },
    ],
    scores: [
      { player: 'Ian', toPar: -1, thru: 18 }, { player: 'Dan', toPar: 2, thru: 18 },
      { player: 'Munley', toPar: 2, thru: 18 }, { player: 'Mallon', toPar: 1, thru: 18 },
      { player: 'Andy', toPar: 2, thru: 15 }, { player: 'Kyle', toPar: 1, thru: 15 },
      { player: 'Carty', toPar: -1, thru: 15 }, { player: 'Marino', toPar: 3, thru: 15 },
      { player: 'Truant', toPar: 1, thru: 12 }, { player: 'Lusty', toPar: 1, thru: 12 },
      { player: 'Fran', toPar: 0, thru: 10 }, { player: 'Musket', toPar: 2, thru: 10 },
    ],
  },
];

const TOTAL_POINTS = 21; // 3 + 3 + 3 + 6 singles AM + 6 singles PM

const fmtPts = (n: number) => `${Math.floor(n)}${n % 1 ? '½' : ''}`.replace(/^0½$/, '½');
const fmtPar = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`);

function netToPar(s: Score, par: number) {
  if (s.toPar !== undefined) return s.toPar;
  return (s.gross ?? 0) - Math.round(HCP[s.player]) - par;
}

// Cup points from every decided match up to and including day `upTo`
function cupThrough(upTo: number) {
  let h = 0;
  let c = 0;
  let decided = 0;
  let live = 0;
  DAYS.slice(0, upTo + 1).forEach((day) =>
    day.matches.forEach((m) => {
      if (m.live) return void live++;
      if (!m.final) return;
      decided++;
      if (m.final.winner === 'H') h += 1;
      else if (m.final.winner === 'C') c += 1;
      else { h += 0.5; c += 0.5; }
    })
  );
  return { h, c, left: TOTAL_POINTS - h - c, decided, live };
}

function Pair({ names, team, won }: { names: string[]; team: Team; won: boolean }) {
  return (
    <div className={`min-w-0 ${team === 'C' ? 'text-left' : 'text-right'}`}>
      {names.map((n) => (
        <p key={n} className={`truncate text-sm leading-snug ${won ? 'text-white font-semibold' : 'text-neutral-300'}`}>
          {team === 'H' && <span className="font-mono text-[11px] mr-1.5" style={{ color: TEAM.H.color }}>{HCP[n].toFixed(1)}</span>}
          {n}
          {team === 'C' && <span className="font-mono text-[11px] ml-1.5" style={{ color: TEAM.C.color }}>{HCP[n].toFixed(1)}</span>}
        </p>
      ))}
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  const winner = m.final ? m.final.winner : m.live?.leader ?? null;
  const tone = winner ? TEAM[winner].color : '#a3a3a3';
  const label = m.final
    ? m.final.winner
      ? `${TEAM[m.final.winner].name} win ${m.final.margin}`
      : 'Halved · AS'
    : m.live!.leader
      ? `${TEAM[m.live!.leader].name} ${m.live!.status}`
      : m.live!.status;
  const point = m.final ? (m.final.winner ? `+1 ${TEAM[m.final.winner].name}` : '½ each') : null;

  return (
    <li className="rounded-md border border-neutral-800 bg-black/60 p-3">
      <div className="flex items-center justify-between mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        <span>{m.tee}</span>
        {m.live ? (
          <span className="flex items-center gap-1.5" style={{ color: '#ef4444' }}>
            <span className="git-pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} aria-hidden="true" />
            Live
          </span>
        ) : (
          <span>Final</span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Pair names={m.hacks} team="H" won={winner === 'H'} />
        <span className="font-mono text-[10px] text-neutral-600">VS</span>
        <Pair names={m.chunkers} team="C" won={winner === 'C'} />
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-neutral-800/80">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wide" style={{ color: tone }}>{label}</span>
        {point && <span className="font-mono text-[10px] text-neutral-500">{point}</span>}
      </div>
    </li>
  );
}

export function BuddyCupTripDemo() {
  const [day, setDay] = useState(DAYS.length - 1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const d = DAYS[day];
  const cup = cupThrough(day);
  const board = [...d.scores].sort((a, b) => netToPar(a, d.par) - netToPar(b, d.par));

  // Arrow keys move between day tabs (WAI-ARIA tabs pattern)
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (day + step + DAYS.length) % DAYS.length;
    setDay(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-800 bg-[#0a0a0a] text-white shadow dark:shadow-gray-950/50">
      {/* Cup score through the selected day */}
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-neutral-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-yellow-500">Pinehurst Cup · sample trip</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mt-3">
          <div className="flex items-baseline gap-3 sm:gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: TEAM.H.color }}>Hacks</p>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums">{fmtPts(cup.h)}</p>
            </div>
            <span className="font-mono text-xs text-neutral-600">vs</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: TEAM.C.color }}>Chunkers</p>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums">{fmtPts(cup.c)}</p>
            </div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500 sm:text-right leading-relaxed">
            Through {d.tab}
            <br className="hidden sm:block" />
            <span className="sm:hidden"> · </span>
            {fmtPts(cup.left)} pts left{cup.live ? ` · ${cup.live} live` : ''}
          </p>
        </div>
      </div>

      {/* Day tabs */}
      <div role="tablist" aria-label="Trip days" className="flex gap-1.5 px-4 sm:px-6 pt-4" onKeyDown={onKey}>
        {DAYS.map((x, i) => (
          <button
            key={x.tab}
            ref={(el) => { tabs.current[i] = el; }}
            role="tab"
            id={`bc-tab-${x.tab}`}
            aria-selected={i === day}
            aria-controls="bc-day-panel"
            tabIndex={i === day ? 0 : -1}
            onClick={() => setDay(i)}
            className={`px-3 py-1.5 rounded font-mono text-xs font-bold tracking-wider border transition-colors ${
              i === day
                ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                : 'border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
            data-track={`Buddy Cup demo — ${x.tab}`}
          >
            {x.tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div
        key={d.tab}
        id="bc-day-panel"
        role="tabpanel"
        aria-labelledby={`bc-tab-${d.tab}`}
        className="feature-rise px-4 sm:px-6 pt-4 pb-5"
      >
        <p className="text-base font-semibold">
          {d.course}
          <span className="ml-2 font-mono text-[11px] font-normal uppercase tracking-[0.15em] text-neutral-500">
            {d.date} · {d.format}
          </span>
        </p>

        <div className="grid md:grid-cols-[3fr_2fr] gap-5 mt-3">
          <section aria-label="Matches">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Matches</p>
            <ul className="grid gap-2">
              {d.matches.map((m) => (
                <MatchCard key={`${m.tee}-${m.hacks[0]}`} m={m} />
              ))}
            </ul>
          </section>

          <section aria-label="Individual net scores">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Individual · net to par</p>
            <ol className="rounded-md border border-neutral-800 divide-y divide-neutral-800/80">
              {board.map((s, i) => {
                const net = netToPar(s, d.par);
                return (
                  <li key={s.player} className="flex items-center gap-2.5 px-3 py-1.5 text-sm">
                    <span className="w-0.5 h-4 rounded-full" style={{ background: TEAM[TEAM_OF[s.player]].color }} aria-hidden="true" />
                    <span className="font-mono text-[10px] text-neutral-600 w-4">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 truncate">{s.player}</span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {s.gross !== undefined ? s.gross : s.thru === 18 ? 'F' : `thru ${s.thru}`}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold w-7 text-right ${net < 0 ? 'text-red-400' : net === 0 ? 'text-white' : 'text-neutral-400'}`}
                    >
                      {fmtPar(net)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
