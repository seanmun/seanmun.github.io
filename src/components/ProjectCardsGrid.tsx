'use client';
// File: src/components/ProjectCardsGrid.tsx
// Purpose: Project card grid with "deck drop" exit choreography.
// Clicking a card lifts it while the rest tumble off-screen like a dropped
// deck, then the frosted card expands to the feature-page hero position
// before navigating. Returning home deals the cards back in.

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { projects, Project } from '@/data/projects';
import { SeesawCard } from '@/components/ui/SeesawCard';
import { ProjectIcon } from '@/components/ui/ProjectIcon';
import { trackLinkClick } from '@/lib/track-utils';

// sessionStorage keys shared with ProjectFeaturePage
export const HERO_FLIP_KEY = 'project-hero-flip';
export const DEAL_IN_KEY = 'project-deal-in';

interface ProjectCardsGridProps {
  cookieId: string;
  onExitingChange?: (exiting: boolean) => void;
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ProjectCardsGrid({ cookieId, onExitingChange }: ProjectCardsGridProps) {
  const router = useRouter();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isExitingRef = useRef(false);

  useEffect(() => {
    // Prefetch all feature pages so navigation after the animation is instant
    projects.forEach((project) => {
      router.prefetch(`/projects/${project.slug}`);
    });

    // Deal the cards back in when arriving from a feature page
    if (sessionStorage.getItem(DEAL_IN_KEY)) {
      sessionStorage.removeItem(DEAL_IN_KEY);
      if (prefersReducedMotion()) return;

      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const spin = (Math.random() - 0.5) * 24;
        el.animate(
          [
            { transform: `translateY(70vh) rotate(${spin}deg)`, opacity: 0 },
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          ],
          {
            duration: 600,
            delay: i * 55,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          }
        );
      });
    }
  }, [router]);

  const handleCardClick = (e: React.MouseEvent, project: Project, index: number) => {
    e.preventDefault();
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    const target = `/projects/${project.slug}`;
    trackLinkClick(cookieId, project.title, target);

    if (prefersReducedMotion()) {
      router.push(target);
      return;
    }

    onExitingChange?.(true);

    const animations: Animation[] = [];
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.pointerEvents = 'none';

      if (i === index) {
        // The chosen card lifts and holds — it becomes the feature page hero
        el.style.zIndex = '30';
        animations.push(
          el.animate(
            [
              { transform: 'translateY(0) scale(1)' },
              { transform: 'translateY(-8px) scale(1.03)' },
            ],
            {
              duration: 400,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'forwards',
            }
          )
        );
      } else {
        // Everyone else loses gravity: staggered tumble off the bottom edge
        const drift = (Math.random() - 0.5) * 220;
        const spin = (Math.random() - 0.5) * 70;
        const delay = i * 45 + Math.random() * 130;
        el.style.zIndex = '20';
        animations.push(
          el.animate(
            [
              { transform: 'translate(0, 0) rotate(0deg)' },
              { transform: `translate(${drift}px, 120vh) rotate(${spin}deg)` },
            ],
            {
              duration: 750,
              delay,
              easing: 'cubic-bezier(0.55, 0, 0.85, 0.4)',
              fill: 'forwards',
            }
          )
        );
      }
    });

    Promise.allSettled(animations.map((a) => a.finished)).then(() => {
      const clicked = cardRefs.current[index];
      if (!clicked) {
        router.push(target);
        return;
      }

      // Frost the chosen card into a blurry window
      const frost = clicked.animate(
        [
          { filter: 'blur(0px)' },
          { filter: 'blur(10px)' },
        ],
        { duration: 260, easing: 'ease-in', fill: 'forwards' }
      );

      Promise.allSettled([frost.finished]).then(() => {
        // Expand the frosted card, right here on the home page, to the spot
        // the feature page hero will occupy. The feature page then picks up
        // from the same frosted state and bursts it clear.
        const rect = clicked.getBoundingClientRect();

        // Promote to fixed positioning at the exact same visual spot; cancel
        // the lift transform in the same frame so nothing visibly jumps
        // (rect already includes the lift)
        clicked.getAnimations().forEach((a) => a !== frost && a.cancel());
        clicked.style.position = 'fixed';
        clicked.style.top = `${rect.top}px`;
        clicked.style.left = `${rect.left}px`;
        clicked.style.width = `${rect.width}px`;
        clicked.style.height = `${rect.height}px`;
        clicked.style.margin = '0';
        clicked.style.zIndex = '40';

        // Where the hero sits on the feature page: max-w-4xl container with
        // p-4, below the "All projects" back button (~52px tall)
        const vw = window.innerWidth;
        const containerWidth = Math.min(896, vw);
        const targetLeft = (vw - containerWidth) / 2 + 16;
        const targetWidth = containerWidth - 32;
        const targetTop = 68;
        const targetHeight = vw >= 640 ? 264 : 320;

        const expand = clicked.animate(
          [
            {
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            },
            {
              top: `${targetTop}px`,
              left: `${targetLeft}px`,
              width: `${targetWidth}px`,
              height: `${targetHeight}px`,
            },
          ],
          { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
        );

        try {
          sessionStorage.setItem(
            HERO_FLIP_KEY,
            JSON.stringify({ slug: project.slug, expanded: true })
          );
        } catch {
          // sessionStorage unavailable — feature page falls back to a fade-in
        }

        Promise.allSettled([expand.finished]).then(() => router.push(target));
      });
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {projects.map((project, index) => (
        <div
          key={project.slug}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          className="relative cursor-pointer"
          onClick={(e) => handleCardClick(e, project, index)}
        >
          <SeesawCard className="h-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow dark:shadow-gray-950/50">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0">
                <ProjectIcon iconName={project.iconName} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{project.description}</p>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {project.techStack.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors tech-tag"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <a
                  href={`/projects/${project.slug}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(e, project, index);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                  aria-label={project.ariaLabel}
                >
                  View Project →
                </a>
              </div>
            </div>
          </SeesawCard>
        </div>
      ))}
    </div>
  );
}
