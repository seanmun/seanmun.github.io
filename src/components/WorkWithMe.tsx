'use client';
// File: src/components/WorkWithMe.tsx
// Purpose: Compact services + contact section for client work inquiries.
// The four service offerings share one row, frost-blurring between them
// (same visual language as the hero handoff); the inquiry form stays
// collapsed until opened.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Rocket, MailPlus, Cpu } from 'lucide-react';
import { ContactForm } from './ContactForm';

const ROTATE_MS = 6000;

const services = [
  {
    icon: Sparkles,
    title: 'AI Systems & Consulting',
    blurb:
      'RAG pipelines, agents, and AI features wired into real products — or a clear-eyed roadmap for where AI actually helps your business.',
  },
  {
    icon: Rocket,
    title: 'Product & MVP Builds',
    blurb:
      'From napkin sketch to deployed app: design, full-stack build, auth, data, and launch. Weeks, not quarters.',
  },
  {
    icon: MailPlus,
    title: 'CRM & Email Systems',
    blurb:
      'My deepest expertise: kinetic email, marketing automation, and CRM architecture for teams that live in the inbox.',
  },
  {
    icon: Cpu,
    title: 'Devices & Experiments',
    blurb:
      'Physical builds and weird ideas: connected displays, Raspberry Pi hardware, bots, and things that don’t exist yet.',
  },
];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function WorkWithMe() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isSwappingRef = useRef(false);

  // Deep links straight to the section (feature-page CTAs) signal contact
  // intent — open the form for them
  useEffect(() => {
    if (window.location.hash === '#work-with-me') setIsFormOpen(true);
  }, []);

  // Frost-blur to another service, hero-handoff style
  const goToService = useCallback((next: number) => {
    if (isSwappingRef.current || next === serviceIndex) return;

    const card = cardRef.current;
    if (!card || prefersReducedMotion()) {
      setServiceIndex(next);
      return;
    }

    isSwappingRef.current = true;
    const frostOut = card.animate(
      [{ filter: 'blur(0px)' }, { filter: 'blur(8px)' }],
      { duration: 240, easing: 'ease-in', fill: 'forwards' }
    );
    Promise.allSettled([frostOut.finished]).then(() => {
      setServiceIndex(next);
      requestAnimationFrame(() => {
        card.animate(
          [{ filter: 'blur(8px)' }, { filter: 'blur(0px)' }],
          { duration: 300, easing: 'ease-out' }
        );
        frostOut.cancel();
        isSwappingRef.current = false;
      });
    });
  }, [serviceIndex]);

  // Auto-rotate, pausing on hover/focus and respecting reduced motion
  useEffect(() => {
    if (isPaused) return;
    if (prefersReducedMotion()) return;
    const timer = setTimeout(
      () => goToService((serviceIndex + 1) % services.length),
      ROTATE_MS
    );
    return () => clearTimeout(timer);
  }, [serviceIndex, isPaused, goToService]);

  const openForm = () => {
    setIsFormOpen(true);
    // Focus the first field once the expand animation has mostly played out
    setTimeout(() => document.getElementById('contact-name')?.focus(), 350);
  };

  const service = services[serviceIndex];

  return (
    <div id="work-with-me" className="mb-10 scroll-mt-6">
      <h2 className="text-xl font-bold mb-1 dark:text-white">Work with me</h2>
      <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-4 max-w-xl">
        I take on client work — if you can describe it, I can probably build it.
      </p>

      {/* Two tiles side by side: rotating service + inquiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          ref={cardRef}
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg h-full flex flex-col"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="flex gap-3 items-start flex-1">
            <service.icon className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1 dark:text-white">{service.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{service.blurb}</p>
            </div>
          </div>

          {/* Service dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {services.map((s, i) => (
              <button
                key={s.title}
                onClick={() => goToService(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === serviceIndex
                    ? 'bg-gray-700 dark:bg-gray-300'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-400'
                }`}
                aria-label={`Show service: ${s.title}`}
                aria-current={i === serviceIndex ? 'true' : undefined}
              />
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg h-full flex flex-col">
          <h3 className="font-semibold mb-1 dark:text-white">
            Tell me what you&apos;re imagining
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
            A rough idea is enough. I&apos;ll reply within a day — usually with
            questions, sometimes with a sketch.
          </p>
          {!isFormOpen && (
            <button
              onClick={openForm}
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              className="self-start px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity mt-3"
            >
              Start an inquiry
            </button>
          )}
        </div>
      </div>

      {/* Expandable form — grid-rows trick animates height: auto smoothly */}
      <div
        aria-hidden={!isFormOpen}
        className={`grid transition-all duration-500 ease-out ${
          isFormOpen
            ? 'grid-rows-[1fr] opacity-100 visible mt-4'
            : 'grid-rows-[0fr] opacity-0 invisible mt-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
