'use client';
import React, { useEffect, useRef } from 'react';

interface SeesawCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SeesawCard({ children, className = '' }: SeesawCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const sheen = sheenRef.current;
    if (!card || !sheen) return;

    const MAX_TILT = 10;
    const STIFFNESS = 180;
    const DAMPING = 12;
    const SETTLE = 0.02;
    const SHADOW_BASE_Y = 12;
    const SHADOW_TILT_SCALE = 1.2;
    const SHEEN_TILT_SCALE = 2.4;

    const state = {
      target: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      hovered: false,
      animId: null as number | null,
      lastTime: 0,
    };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = mq.matches;

    const isDark = () => document.documentElement.classList.contains('dark');

    const render = () => {
      const cx = state.current.x;
      const cy = state.current.y;
      card.style.transform = `perspective(1400px) rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg)`;
      const shX = -cy * SHADOW_TILT_SCALE;
      const shY = SHADOW_BASE_Y + cx * SHADOW_TILT_SCALE;
      const shBlur = 26 + (Math.abs(cx) + Math.abs(cy)) * 1.5;
      const baseAlpha = isDark() ? 0.45 : 0.18;
      const shAlpha = baseAlpha + (Math.abs(cx) + Math.abs(cy)) * 0.004;
      card.style.boxShadow = `${shX.toFixed(1)}px ${shY.toFixed(1)}px ${shBlur.toFixed(1)}px rgba(0,0,0,${shAlpha.toFixed(3)})`;
      const sheenX = 50 + cy * SHEEN_TILT_SCALE;
      const sheenY = 50 - cx * SHEEN_TILT_SCALE;
      sheen.style.setProperty('--sheen-x', `${sheenX.toFixed(2)}%`);
      sheen.style.setProperty('--sheen-y', `${sheenY.toFixed(2)}%`);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - state.lastTime) / 1000);
      state.lastTime = now;

      const fx = (state.target.x - state.current.x) * STIFFNESS;
      state.velocity.x += fx * dt;
      state.velocity.x *= Math.exp(-DAMPING * dt);
      state.current.x += state.velocity.x * dt;

      const fy = (state.target.y - state.current.y) * STIFFNESS;
      state.velocity.y += fy * dt;
      state.velocity.y *= Math.exp(-DAMPING * dt);
      state.current.y += state.velocity.y * dt;

      render();

      const dx = state.target.x - state.current.x;
      const dy = state.target.y - state.current.y;
      const settled =
        Math.abs(dx) < SETTLE &&
        Math.abs(dy) < SETTLE &&
        Math.abs(state.velocity.x) < SETTLE &&
        Math.abs(state.velocity.y) < SETTLE;

      if (state.hovered || !settled) {
        state.animId = requestAnimationFrame(tick);
      } else {
        state.current.x = state.current.y = 0;
        state.velocity.x = state.velocity.y = 0;
        card.style.transform = '';
        card.style.boxShadow = '';
        state.animId = null;
      }
    };

    const startLoop = () => {
      if (state.animId !== null) return;
      state.lastTime = performance.now();
      state.animId = requestAnimationFrame(tick);
    };

    const updateTarget = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const cxp = rect.left + rect.width * 0.5;
      const cyp = rect.top + rect.height * 0.5;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cxp) / (rect.width * 0.5)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cyp) / (rect.height * 0.5)));
      state.target.x = -ny * MAX_TILT;
      state.target.y = nx * MAX_TILT;
    };

    const onEnter = (e: PointerEvent) => {
      if (reducedMotion) return;
      state.hovered = true;
      updateTarget(e);
      sheen.style.opacity = '1';
      startLoop();
    };
    const onMove = (e: PointerEvent) => {
      if (reducedMotion || !state.hovered) return;
      updateTarget(e);
    };
    const onLeave = () => {
      if (reducedMotion) return;
      state.hovered = false;
      state.target.x = 0;
      state.target.y = 0;
      sheen.style.opacity = '0';
    };
    const onMotionChange = (ev: MediaQueryListEvent) => {
      reducedMotion = ev.matches;
      if (ev.matches) {
        state.hovered = false;
        state.target.x = state.target.y = 0;
        state.current.x = state.current.y = 0;
        state.velocity.x = state.velocity.y = 0;
        card.style.transform = '';
        card.style.boxShadow = '';
        sheen.style.opacity = '0';
      }
    };

    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    mq.addEventListener('change', onMotionChange);

    return () => {
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      mq.removeEventListener('change', onMotionChange);
      if (state.animId !== null) cancelAnimationFrame(state.animId);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`seesaw-card relative overflow-hidden ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {children}
      <div
        ref={sheenRef}
        className="seesaw-sheen pointer-events-none absolute inset-0"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
