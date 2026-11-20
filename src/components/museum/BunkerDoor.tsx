'use client';
// File: src/components/museum/BunkerDoor.tsx
// Purpose: The conversation at the door in the museum's bunker, a sibling
// of the one at /projects/classified. Knock, the slot slides open, and the
// eyes ask for the password, then "the red or the white?". Answers go to
// /api/vault, the same doorman (rate limits and all); nothing secret lives
// here. Get both right and the server sets the pass, the bolts draw back,
// the door swings open onto the back room, and "Step inside" goes to it.
// The 3D door's moves are driven through DoorControls (vault.ts).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { DoorControls } from './vault';

type Phase = 'closed' | 'knocking' | 'password' | 'checking' | 'wine' | 'shutting' | 'welcome' | 'open' | 'tired';

// A few lines of Web Audio; the context starts on the first knock (a click)
function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ctx = () => {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  };
  useEffect(() => () => { ctxRef.current?.close().catch(() => {}); }, []);
  const safe = (fn: (c: AudioContext) => void) => { try { fn(ctx()); } catch { /* silent door */ } };
  const noise = (c: AudioContext, at: number, secs: number, type: BiquadFilterType, freq: number, level: number) => {
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = level;
    src.connect(f).connect(g).connect(c.destination);
    src.start(c.currentTime + at);
  };
  const thud = (c: AudioContext, at: number, strength: number) => {
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.14);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45 * strength, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.22);
    noise(c, at, 0.05, 'lowpass', 1100, 0.18 * strength);
  };
  return {
    knock: () => safe((c) => [0, 0.24, 0.48].forEach((at, i) => thud(c, at, i === 2 ? 1 : 0.8))),
    slide: () => safe((c) => noise(c, 0, 0.28, 'bandpass', 2400, 0.12)),
    slam: () => safe((c) => { thud(c, 0, 1.3); noise(c, 0, 0.12, 'highpass', 3000, 0.15); }),
    bolts: () => safe((c) => [0, 0.18].forEach((at) => noise(c, at, 0.09, 'bandpass', 1600, 0.3))),
  };
}

// The doorman's line, typed out a letter at a time
function useTyped(text: string) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, 36);
    return () => window.clearInterval(timer);
  }, [text]);
  return text ? shown : '';
}

export function BunkerDoor({ door, register }: { door: () => DoorControls | null; register: (knock: () => void) => void }) {
  const sounds = useSounds();
  const [phase, setPhase] = useState<Phase>('closed');
  const [line, setLine] = useState('');
  const [answer, setAnswer] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const slams = useRef(0);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const spoken = useTyped(line);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => { const t = timers.current; return () => t.forEach((id) => window.clearTimeout(id)); }, []);

  const knock = useCallback(() => {
    if (phase !== 'closed') return;
    setPhase('knocking');
    setLine('');
    sounds.knock();
    door()?.knock();
    later(1150, () => {
      sounds.slide();
      door()?.slot(true);
      door()?.mood('suspicious');
    });
    later(1650, () => {
      setLine("What's the password?");
      setPhase('password');
      later(80, () => inputRef.current?.focus());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, door]);
  // Clicking the door in the scene knocks too
  useEffect(() => {
    register(knock);
    return () => register(() => {});
  }, [register, knock]);

  const shut = (said: string, tired?: number) => {
    setPhase('shutting');
    door()?.mood('suspicious');
    setLine(said);
    later(900, () => { sounds.slam(); door()?.slot(false, true); });
    later(1500, () => {
      slams.current += 1;
      setAnswer('');
      setTicket(null);
      door()?.mood('neutral');
      if (tired) {
        setPhase('tired');
        setLine(`Nobody's answering. Try again in ${tired} minute${tired === 1 ? '' : 's'}.`);
      } else {
        setPhase('closed');
        setLine(slams.current >= 2 ? 'Knock again if you remember it.' : '');
      }
    });
  };

  const ask = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return (await res.json().catch(() => ({}))) as { next?: 'wine'; ticket?: string; ok?: boolean; slam?: string; tired?: number };
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'password' || !answer.trim()) return;
    setPhase('checking');
    try {
      const reply = await ask({ step: 'password', answer });
      if (reply.tired) return shut('…', reply.tired);
      if (reply.next === 'wine' && reply.ticket) {
        setTicket(reply.ticket);
        door()?.mood('neutral');
        setLine('The red or the white?');
        setPhase('wine');
        return;
      }
      shut('Wrong. Back to the fairway.');
    } catch {
      shut("We're closed.");
    }
  };

  const chooseWine = async (wine: 'red' | 'white') => {
    if (phase !== 'wine') return;
    setPhase('checking');
    try {
      const reply = await ask({ step: 'wine', answer: wine, ticket });
      if (reply.tired) return shut('…', reply.tired);
      if (!reply.ok) return shut(wine === 'red' ? 'Wrong answer.' : 'Wrong.');
      // In: the eyes soften, the slot closes, the bolts draw back, and the
      // door swings open onto the back room
      setPhase('welcome');
      door()?.mood('pleased');
      setLine('Welcome to the nineteenth hole.');
      later(1100, () => { sounds.slide(); door()?.slot(false); });
      later(1600, () => sounds.bolts());
      later(2100, () => door()?.swing());
      later(2900, () => setPhase('open'));
    } catch {
      shut("We're closed.");
    }
  };

  return (
    <div className="mt-3">
      <p className="min-h-[1.5rem] font-serif italic text-[17px] text-[#f1dfb8]" aria-live="polite">{spoken}</p>
      {(phase === 'closed' || phase === 'knocking') && (
        <button onClick={knock} disabled={phase === 'knocking'} className="mt-2 rounded-full bg-[#b08a3e] text-black px-5 py-1.5 text-sm font-semibold hover:bg-[#c49c4d] disabled:opacity-60">
          Knock
        </button>
      )}
      {(phase === 'password' || (phase === 'checking' && !ticket)) && (
        <form onSubmit={submitPassword} className="mt-2 flex gap-2">
          <label htmlFor="bunker-password" className="sr-only">Password</label>
          <input
            id="bunker-password"
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="The password"
            className="flex-1 min-w-0 rounded-full bg-black/40 border border-white/25 px-4 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#c49c4d]"
          />
          <button type="submit" disabled={phase === 'checking' || !answer.trim()} className="rounded-full bg-[#b08a3e] text-black px-4 py-1.5 text-sm font-semibold disabled:opacity-50">
            Say it
          </button>
        </form>
      )}
      {(phase === 'wine' || (phase === 'checking' && ticket)) && (
        <div className="mt-2 flex gap-2">
          <button onClick={() => chooseWine('red')} disabled={phase === 'checking'} className="rounded-full bg-[#7a1f2b] text-white px-5 py-1.5 text-sm font-semibold hover:bg-[#8e2733]">Red</button>
          <button onClick={() => chooseWine('white')} disabled={phase === 'checking'} className="rounded-full bg-[#efe6c8] text-black px-5 py-1.5 text-sm font-semibold hover:bg-white">White</button>
        </div>
      )}
      {phase === 'open' && (
        <Link href="/projects/classified" className="mt-2 inline-block rounded-full bg-[#f1dfb8] text-black px-5 py-1.5 text-sm font-semibold hover:bg-white">
          Step inside →
        </Link>
      )}
    </div>
  );
}
