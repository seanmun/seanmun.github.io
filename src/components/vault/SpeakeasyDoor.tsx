'use client';
// File: src/components/vault/SpeakeasyDoor.tsx
// Purpose: The way into the classified projects. Knock, and a slot in the
// door slides open; a pair of eyes asks for the password, then "the red or
// the white?". The white gets you in; anything else and the slot slams shut.
// Answers go to /api/vault — nothing secret lives in this file.
// - The eyes follow the cursor (idle glances on touch screens) and blink.
// - Sounds are synthesized with Web Audio and only ever start from a click.
// - Reduced motion: no shaking, swinging or typing-out; the flow is the same.
// The analog version: typed password, buttons for the wine. A later version
// can swap these inputs for listening, without changing the door.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DEAL_IN_KEY } from '@/components/ProjectCardsGrid';

type Phase = 'closed' | 'knocking' | 'password' | 'checking' | 'wine' | 'shutting' | 'welcome' | 'tired';
type Mood = 'neutral' | 'suspicious' | 'pleased';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Sound: a few lines of Web Audio instead of audio files
function useDoorSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtor();
    }
    return ctxRef.current;
  }, []);

  const noise = useCallback((at: number, seconds: number, filterType: BiquadFilterType, frequency: number, level: number) => {
    const c = ctx();
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const gain = c.createGain();
    gain.gain.value = level;
    source.connect(filter).connect(gain).connect(c.destination);
    source.start(c.currentTime + at);
  }, [ctx]);

  // Knuckles on wood: a falling low thump plus a short filtered crack
  const thud = useCallback((at: number, strength: number) => {
    const c = ctx();
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.14);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.45 * strength, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.22);
    noise(at, 0.05, 'lowpass', 1100, 0.18 * strength);
  }, [ctx, noise]);

  const play = useCallback((fn: () => void) => {
    try {
      fn();
    } catch {
      // No audio available — the door still works in silence
    }
  }, []);

  return {
    knock: () => play(() => [0, 0.24, 0.48].forEach((at) => thud(at, 1))),
    slide: () => play(() => noise(0, 0.28, 'bandpass', 2400, 0.12)),
    slam: () => play(() => { thud(0, 1.7); noise(0, 0.09, 'highpass', 3000, 0.2); }),
    bolts: () => play(() => [0, 0.16, 0.42].forEach((at) => noise(at, 0.035, 'highpass', 4200, 0.28))),
  };
}

// The doorman's lines appear a letter at a time
function useTypewriter(text: string) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (prefersReducedMotion() || !text) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, 38);
    return () => window.clearInterval(timer);
  }, [text]);
  return shown;
}

function Eyes({ mood, blinking, look }: { mood: Mood; blinking: boolean; look: { x: number; y: number } }) {
  const lid = blinking ? 0.08 : mood === 'suspicious' ? 0.55 : mood === 'pleased' ? 0.4 : 1;
  return (
    <div className="speakeasy-eyes" aria-hidden="true">
      {[0, 1].map((side) => (
        <div key={side} className="speakeasy-eye" style={{ transform: `scaleY(${lid})` }}>
          <div className="speakeasy-iris" style={{ transform: `translate(${look.x * 5}px, ${look.y * 2.5}px)` }}>
            <div className="speakeasy-pupil" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpeakeasyDoor() {
  const router = useRouter();
  const sounds = useDoorSounds();
  const doorRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const slamsRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const [phase, setPhase] = useState<Phase>('closed');
  const [line, setLine] = useState('');
  const [slotOpen, setSlotOpen] = useState(false);
  const [slamming, setSlamming] = useState(false);
  const [mood, setMood] = useState<Mood>('neutral');
  const [blinking, setBlinking] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [answer, setAnswer] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const spoken = useTypewriter(line);
  const later = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  // Returning home from here deals the cards back in, like any project page
  useEffect(() => {
    try {
      sessionStorage.setItem(DEAL_IN_KEY, '1');
    } catch {
      // non-essential
    }
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // Eyes follow the cursor; on touch screens they glance around on their own
  useEffect(() => {
    if (!slotOpen) return;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover) {
      const onMove = (e: PointerEvent) => {
        const slot = slotRef.current?.getBoundingClientRect();
        if (!slot) return;
        const dx = e.clientX - (slot.left + slot.width / 2);
        const dy = e.clientY - (slot.top + slot.height / 2);
        setLook({ x: Math.max(-1, Math.min(1, dx / 260)), y: Math.max(-1, Math.min(1, dy / 200)) });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    }
    const timer = window.setInterval(() => setLook({ x: Math.random() * 2 - 1, y: Math.random() - 0.3 }), 1600);
    return () => window.clearInterval(timer);
  }, [slotOpen]);

  // Blink every few seconds while the slot is open
  useEffect(() => {
    if (!slotOpen || prefersReducedMotion()) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlinking(true);
        window.setTimeout(() => setBlinking(false), 140);
        schedule();
      }, 2400 + Math.random() * 3200);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [slotOpen]);

  const jolt = (distance: number) => {
    if (prefersReducedMotion()) return;
    doorRef.current?.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${distance}px)` }, { transform: `translateX(${-distance / 2}px)` }, { transform: 'translateX(0)' }],
      { duration: 160, easing: 'ease-out' }
    );
  };

  const knock = () => {
    if (phase !== 'closed') return;
    setPhase('knocking');
    setLine('');
    sounds.knock();
    [0, 240, 480].forEach((ms) => later(ms, () => jolt(2)));
    later(1250, () => {
      sounds.slide();
      setSlotOpen(true);
      setMood('suspicious');
    });
    later(1750, () => {
      setLine("What's the password?");
      setPhase('password');
      later(100, () => inputRef.current?.focus());
    });
  };

  const shutTheSlot = (said: string, tiredMinutes?: number) => {
    setPhase('shutting');
    setMood('suspicious');
    setLine(said);
    later(900, () => {
      setSlamming(true);
      setSlotOpen(false);
      sounds.slam();
      jolt(5);
    });
    later(1500, () => {
      setSlamming(false);
      slamsRef.current += 1;
      setAnswer('');
      setTicket(null);
      setMood('neutral');
      if (tiredMinutes) {
        setPhase('tired');
        setLine(`Nobody's answering. Try again in ${tiredMinutes} minute${tiredMinutes === 1 ? '' : 's'}.`);
      } else {
        setPhase('closed');
        setLine(slamsRef.current >= 2 ? 'Knock again if you remember it.' : '');
      }
    });
  };

  const ask = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return (await res.json().catch(() => ({}))) as {
      next?: 'wine'; ticket?: string; ok?: boolean; slam?: 'password' | 'wine'; tired?: number; error?: string;
    };
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'password' || !answer.trim()) return;
    setPhase('checking');
    try {
      const reply = await ask({ step: 'password', answer });
      if (reply.tired) return shutTheSlot('…', reply.tired);
      if (reply.next === 'wine' && reply.ticket) {
        setTicket(reply.ticket);
        setMood('neutral');
        setLine('The red or the white?');
        setPhase('wine');
        return;
      }
      shutTheSlot('Wrong.');
    } catch {
      shutTheSlot("We're closed.");
    }
  };

  const chooseWine = async (wine: 'red' | 'white') => {
    if (phase !== 'wine') return;
    setPhase('checking');
    try {
      const reply = await ask({ step: 'wine', answer: wine, ticket });
      if (reply.tired) return shutTheSlot('…', reply.tired);
      if (!reply.ok) return shutTheSlot(wine === 'red' ? 'Wrong answer.' : 'Wrong.');

      // In: the eyes soften, the slot closes gently, the bolts draw back,
      // the door swings open — and the server shows the room behind it
      setPhase('welcome');
      setMood('pleased');
      setLine('Welcome.');
      later(1100, () => {
        sounds.slide();
        setSlotOpen(false);
      });
      later(1600, () => sounds.bolts());
      later(2200, () => setOpening(true));
      later(prefersReducedMotion() ? 2300 : 3300, () => router.refresh());
    } catch {
      shutTheSlot("We're closed.");
    }
  };

  return (
    <div className="speakeasy-scene min-h-screen relative overflow-hidden flex flex-col items-center px-4 pb-16">
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-100/70 hover:text-blue-50 hover:bg-white/5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All projects
      </Link>

      <div className="speakeasy-lamp" aria-hidden="true" />

      <div className="speakeasy-frame mt-24 sm:mt-28">
        {/* Warm light from the room, seen once the door swings */}
        <div className={`speakeasy-doorway ${opening ? 'is-open' : ''}`} aria-hidden="true" />
        <div
          ref={doorRef}
          className={`speakeasy-door ${opening ? 'is-open' : ''}`}
          onClick={knock}
          role="button"
          tabIndex={phase === 'closed' ? 0 : -1}
          aria-label="Knock on the door"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              knock();
            }
          }}
        >
          <div className="speakeasy-panel speakeasy-panel-top" />
          <div className="speakeasy-panel speakeasy-panel-bottom" />
          <div className="speakeasy-strap" style={{ top: '46%' }} />
          <div className="speakeasy-strap" style={{ top: '80%' }} />
          <div className="speakeasy-handle" />
          <div ref={slotRef} className="speakeasy-slot">
            <Eyes mood={mood} blinking={blinking} look={look} />
            <div className={`speakeasy-cover ${slotOpen ? 'is-open' : ''} ${slamming ? 'is-slamming' : ''}`} />
          </div>
        </div>
      </div>

      {/* What the doorman says */}
      <p className="speakeasy-line mt-8 min-h-[2.25rem] text-center" aria-live="polite">
        {spoken}
      </p>

      <div className="mt-4 w-full max-w-xs flex flex-col items-center gap-3 min-h-[6rem]">
        {(phase === 'closed' || phase === 'knocking') && (
          <button onClick={knock} disabled={phase === 'knocking'} className="speakeasy-brass px-6 py-2.5 rounded-md font-semibold tracking-wide">
            Knock
          </button>
        )}

        {(phase === 'password' || (phase === 'checking' && !ticket)) && (
          <form onSubmit={submitPassword} className="w-full flex gap-2">
            <label htmlFor="speakeasy-password" className="sr-only">Password</label>
            <input
              id="speakeasy-password"
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="The password"
              disabled={phase === 'checking'}
              className="speakeasy-input flex-1 min-w-0 px-3 py-2 rounded-md"
            />
            <button type="submit" disabled={phase === 'checking' || !answer.trim()} className="speakeasy-brass px-4 py-2 rounded-md font-semibold">
              Say it
            </button>
          </form>
        )}

        {(phase === 'wine' || (phase === 'checking' && ticket)) && (
          <div className="flex gap-3">
            <button onClick={() => chooseWine('red')} disabled={phase === 'checking'} className="speakeasy-red px-5 py-2.5 rounded-md font-semibold">
              The red
            </button>
            <button onClick={() => chooseWine('white')} disabled={phase === 'checking'} className="speakeasy-white px-5 py-2.5 rounded-md font-semibold">
              The white
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
