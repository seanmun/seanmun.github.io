'use client';
// File: src/components/ProjectFeaturePage.tsx
// Purpose: Full feature page for a single project. The hero morphs in from
// the clicked card's position (FLIP via rect stashed in sessionStorage by
// ProjectCardsGrid); the rest of the content rises in staggered below it.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { Project, statusConfig } from '@/data/projects';
import { ProjectIcon } from '@/components/ui/ProjectIcon';
import { SmokeBackgroundLazy } from '@/components/ui/SmokeBackgroundLazy';
import { HERO_FLIP_KEY, DEAL_IN_KEY } from '@/components/ProjectCardsGrid';

interface ProjectFeaturePageProps {
  project: Project;
}

interface StoredHeroHandoff {
  slug: string;
  expanded?: boolean; // card already expanded to hero position on the home page
  rect?: { top: number; left: number; width: number; height: number };
}

const highlightStyles = {
  green: {
    box: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    title: 'text-green-800 dark:text-green-300',
    text: 'text-green-700 dark:text-green-300',
  },
  blue: {
    box: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    title: 'text-blue-800 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    box: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
    title: 'text-amber-800 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-300',
  },
  purple: {
    box: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
    title: 'text-purple-800 dark:text-purple-300',
    text: 'text-purple-700 dark:text-purple-300',
  },
};

// Hero burst timing: the frosted window (already expanded on the home page)
// holds a beat, then bursts clear
const HOLD_MS = 120;
const BURST_MS = 320;
const BURST_STRIP_COUNT = 12;

export function ProjectFeaturePage({ project }: ProjectFeaturePageProps) {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const burstRingRef = useRef<HTMLDivElement>(null);

  // Milliseconds the below-hero content should hold before rising in
  // (null = direct visit, no handoff animation)
  const [revealDelayMs, setRevealDelayMs] = useState<number | null>(null);
  const [showBurstStrips, setShowBurstStrips] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gatedUrl, setGatedUrl] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const content = project.modalContent ?? {};
  const images = content.images ?? [];
  const status = statusConfig[project.status];

  // Hero burst-in: the home page already expanded the frosted card to this
  // exact spot, so the hero picks up frosted and full-size, holds a beat,
  // then bursts clear — blur snaps off with a scale pop, a glow ring
  // radiates, and band strips peel away with the text ready underneath
  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    let handoff: StoredHeroHandoff | null = null;
    try {
      const stored = sessionStorage.getItem(HERO_FLIP_KEY);
      if (stored) {
        sessionStorage.removeItem(HERO_FLIP_KEY);
        const parsed = JSON.parse(stored) as StoredHeroHandoff;
        if (parsed.slug === project.slug) handoff = parsed;
      }
    } catch {
      // fall through to the fade-in
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (handoff?.expanded) {
      setRevealDelayMs(HOLD_MS + BURST_MS);

      const total = HOLD_MS + BURST_MS;
      const holdEnd = HOLD_MS / total;
      const popPeak = holdEnd + (1 - holdEnd) * 0.55;
      el.animate(
        [
          { offset: 0, easing: 'linear', transform: 'scale(1)', filter: 'blur(10px)' },
          { offset: holdEnd, easing: 'ease-in-out', transform: 'scale(1)', filter: 'blur(8px)' },
          { offset: popPeak, easing: 'ease-in-out', transform: 'scale(1.02)', filter: 'blur(0px)' },
          { offset: 1, transform: 'scale(1)', filter: 'blur(0px)' },
        ],
        { duration: total }
      );

      // Glow ring radiates out at the moment of the burst
      const ring = burstRingRef.current;
      if (ring) {
        ring.animate(
          [
            { offset: 0, opacity: 0, transform: 'scale(0.985)' },
            { offset: 0.25, opacity: 0.9, transform: 'scale(1)' },
            { offset: 1, opacity: 0, transform: 'scale(1.12)' },
          ],
          { duration: 520, delay: HOLD_MS, easing: 'ease-out', fill: 'backwards' }
        );
      }

      // Band strips (same visual as the bio hero's BandReveal) peel away at burst
      const stripsOn = setTimeout(() => setShowBurstStrips(true), HOLD_MS);
      const stripsOff = setTimeout(() => setShowBurstStrips(false), HOLD_MS + 1000);
      return () => {
        clearTimeout(stripsOn);
        clearTimeout(stripsOff);
      };
    } else {
      el.animate(
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  }, [project.slug]);

  // Any return to the home page (back button or browser back) deals the cards back in
  useEffect(() => {
    try {
      sessionStorage.setItem(DEAL_IN_KEY, '1');
    } catch {
      // non-essential nicety
    }
  }, []);

  const goHome = () => {
    router.push('/');
  };

  const openUrl = (url: string) => {
    if (url.startsWith('/')) {
      router.push(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCtaClick = (url: string) => {
    if (project.requiresPassword && !url.startsWith('/') && !url.startsWith('mailto:')) {
      setGatedUrl(url);
      setIsGateOpen(true);
      setPassword('');
      setPasswordError('');
      return;
    }
    openUrl(url);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_PROJECTS_PASSWORD) {
      setIsGateOpen(false);
      openUrl(gatedUrl);
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const primaryCta = (() => {
    if (content.callToAction?.primary) return content.callToAction.primary;
    if (project.triggerAmberModal) return { label: 'Try Amber Mode', url: '/?section=amber' };
    if (project.link) {
      return project.link.includes('github.com')
        ? { label: 'View on GitHub', url: project.link }
        : { label: 'View Live Site', url: project.link };
    }
    return null;
  })();

  const secondaryCta =
    content.callToAction?.secondary ?? {
      label: 'Get in touch',
      url: 'mailto:sean.munley@protonmail.com',
    };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const ctaButtons = (
    <div className="flex flex-col sm:flex-row gap-3">
      {primaryCta && (
        <button
          onClick={() => handleCtaClick(primaryCta.url)}
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
        >
          <ExternalLink className="w-4 h-4" />
          {primaryCta.label}
        </button>
      )}
      <a
        href={secondaryCta.url}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {secondaryCta.label}
      </a>
    </div>
  );

  // Stagger helper for the content sections below the hero. After a card
  // handoff the text holds until the burst clears, then rises in.
  const riseBase = revealDelayMs != null ? revealDelayMs / 1000 : 0.25;
  let riseIndex = 0;
  const rise = () => ({
    className: 'feature-rise',
    style: { animationDelay: `${riseBase + riseIndex++ * 0.08}s` },
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Ambient smoke background: GPU fluid sim stirred by the cursor */}
      <SmokeBackgroundLazy />
      <div className="relative max-w-4xl mx-auto p-4">
        {/* Back to all projects */}
        <button
          onClick={goHome}
          className="feature-rise flex items-center gap-2 py-4 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          style={{ animationDelay: revealDelayMs != null ? `${revealDelayMs / 1000}s` : '0s' }}
          aria-label="Back to all projects"
        >
          <ArrowLeft className="w-4 h-4" />
          All projects
        </button>

        {/* Hero — the frosted card expands into this, then bursts clear */}
        <div
          ref={heroRef}
          className="relative p-6 sm:p-8 bg-gray-50 dark:bg-gray-800 rounded-lg mb-8 shadow dark:shadow-gray-950/50"
        >
          {/* Burst glow ring — animated at the moment the blur clears */}
          <div
            ref={burstRingRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              opacity: 0,
              boxShadow:
                '0 0 0 2px rgba(59, 130, 246, 0.55), 0 0 42px 8px rgba(74, 222, 128, 0.3)',
            }}
          />

          {/* Band strips peel away at burst, same visual as the bio hero */}
          {showBurstStrips && (
            <div className="band-reveal-strips rounded-lg" aria-hidden="true">
              {Array.from({ length: BURST_STRIP_COUNT }).map((_, i) => (
                <span
                  key={i}
                  className={`band-reveal-strip ${i % 2 === 0 ? 'up' : 'down'}`}
                  style={{
                    left: `calc(${(i / BURST_STRIP_COUNT) * 100}% - 0.5px)`,
                    width: `calc(${100 / BURST_STRIP_COUNT}% + 1px)`,
                    animationDelay: `${i * 30}ms`,
                    animationDuration: '620ms',
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="flex-shrink-0">
              <ProjectIcon
                iconName={project.iconName}
                className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-4xl font-bold dark:text-white">
                  {project.title}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.colorClass}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {project.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors tech-tag"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {ctaButtons}
            </div>
          </div>
        </div>

        {/* Content card — everything below the hero lives on one card */}
        <div {...rise()}>
        <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-800 rounded-lg mb-8 shadow dark:shadow-gray-950/50">

        {/* Overview */}
        <div {...rise()}>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-8">
            {content.overview ?? project.description}
          </p>
        </div>

        {/* Image carousel */}
        {images.length > 0 && (
          <div {...rise()}>
            <div className="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden mb-8">
              <div
                className="relative h-64 md:h-[28rem] cursor-pointer"
                onClick={() => setFullscreenImage(images[currentImageIndex].src)}
              >
                <Image
                  src={images[currentImageIndex].src}
                  alt={images[currentImageIndex].alt}
                  fill
                  className="object-contain"
                  quality={85}
                  priority={currentImageIndex === 0}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex justify-center gap-2 py-3">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? 'bg-gray-700 dark:bg-gray-300'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-400'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {images[currentImageIndex].caption && (
                <div className="px-4 pb-3 text-sm text-center text-gray-600 dark:text-gray-400">
                  {images[currentImageIndex].caption}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Features */}
        {content.keyFeatures && content.keyFeatures.length > 0 && (
          <div {...rise()}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3 dark:text-white">Key Features</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                {content.keyFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Technical Details */}
        {content.technicalDetails && (
          <div {...rise()}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3 dark:text-white">Technical Stack</h2>
              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                {content.technicalDetails}
              </p>
            </div>
          </div>
        )}

        {/* Planned Features */}
        {content.plannedFeatures && content.plannedFeatures.length > 0 && (
          <div {...rise()}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3 dark:text-white">Planned Features</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                {content.plannedFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Special Sections */}
        {content.specialSections?.map((section, index) => {
          const colors = highlightStyles[section.highlightColor ?? 'green'];
          return (
            <div key={index} {...rise()}>
              <div className={`p-4 rounded-lg border-2 mb-8 ${colors.box}`}>
                <h2 className={`text-lg font-medium mb-3 ${colors.title}`}>{section.title}</h2>
                {section.image && (
                  <div className="flex justify-center mb-3">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={400}
                      height={300}
                      quality={85}
                      className="rounded-lg max-w-full h-auto border border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className={`text-sm ${colors.text}`}>{section.content}</p>
              </div>
            </div>
          );
        })}

        {/* Bottom CTA */}
        <div {...rise()}>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {ctaButtons}
          </div>
        </div>

        </div>
        </div>
        {/* End content card */}

        {/* Hire CTA */}
        <div {...rise()}>
          <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-800 rounded-lg mb-12 shadow dark:shadow-gray-950/50">
            <h2 className="text-xl font-bold mb-2 dark:text-white">
              Want something like this built?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-xl">
              I take on client work — sites, apps, AI systems, and devices.
              Tell me what you&apos;re imagining and I&apos;ll tell you how I&apos;d build it.
            </p>
            <Link
              href="/#work-with-me"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              className="inline-block px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Work with me →
            </Link>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={fullscreenImage}
                alt="Fullscreen view"
                width={1200}
                height={800}
                className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
                quality={100}
              />
            </div>
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Close fullscreen"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Password Gate */}
      {isGateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Enter Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                placeholder="Password"
                autoFocus
              />
              {passwordError && <p className="text-red-500 text-sm mb-2">{passwordError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGateOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--accent)' }}
                  className="px-4 py-2 text-white rounded hover:opacity-90"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
