'use client';
// File: src/components/vault/VaultRoom.tsx
// Purpose: Behind the door. Rendered only for a visitor holding a valid pass
// (the server checks before it sends a word of this), so the projects never
// reach anyone who didn't get past the doorman.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { DEAL_IN_KEY } from '@/components/ProjectCardsGrid';
import { statusConfig } from '@/data/projects';
import type { VaultProject } from '@/lib/vault';

export function VaultRoom({ projects }: { projects: VaultProject[] }) {
  const router = useRouter();
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(DEAL_IN_KEY, '1');
    } catch {
      // non-essential
    }
  }, []);

  // Forget the pass on this browser: next visit, it's the door again
  const lockUp = async () => {
    setLocking(true);
    await fetch('/api/vault', { method: 'DELETE' }).catch(() => {});
    router.refresh();
  };

  return (
    <div className="speakeasy-room min-h-screen px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-sm text-blue-100/70 hover:text-blue-50 hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All projects
          </Link>
          <button
            onClick={lockUp}
            disabled={locking}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-100/60 hover:text-blue-50 hover:bg-white/5 transition-colors"
          >
            <Lock className="w-4 h-4" />
            {locking ? 'Locking up…' : 'Lock up on the way out'}
          </button>
        </div>

        <header className="feature-rise mt-6 mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300/70">Classified</p>
          <h1 className="speakeasy-title text-4xl sm:text-5xl mt-2">The back room</h1>
          <p className="text-blue-100/70 mt-3 max-w-xl">
            Projects that aren&apos;t ready for daylight. You didn&apos;t hear about them here.
          </p>
        </header>

        {projects.length === 0 ? (
          <p className="text-blue-100/60">The room is empty tonight.</p>
        ) : (
          <div className="space-y-6">
            {projects.map((project, index) => (
              <article
                key={project.id}
                className="feature-rise speakeasy-card rounded-lg p-6 sm:p-8"
                style={{ animationDelay: `${0.15 + index * 0.1}s` }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-blue-50">{project.title}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[project.status]?.colorClass ?? ''}`}>
                    {statusConfig[project.status]?.label ?? project.status}
                  </span>
                </div>
                {project.tagline && <p className="text-blue-200/80 italic mb-4">{project.tagline}</p>}
                <p className="text-blue-50/85 leading-relaxed mb-5">{project.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white/10 text-blue-50/80">
                      {tech}
                    </span>
                  ))}
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="speakeasy-brass inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {project.linkLabel ?? 'Open'}
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
