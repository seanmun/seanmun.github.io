// File: src/components/ui/KineticPipelineDiagram.tsx
// Purpose: Kinetic.email's generation pipeline as a flow: a horizontal rail
// on wide screens, a vertical one on phones. Built from HTML rather than a
// fixed-size SVG so the labels stay legible at every width and follow the
// site's light / dark / Amber themes. The bullets under it carry the detail.

import React from 'react';

const STAGES: { name: string; model: string; does: string; parallel?: string[] }[] = [
  { name: 'Brief', model: 'Haiku', does: 'Prompt + brand become a structured brief' },
  { name: 'Blueprint', model: 'Haiku', does: 'Binding design tokens for both builds' },
  { name: 'RAG', model: 'Pinecone + Claude re-rank', does: 'Top 7 proven examples retrieved' },
  { name: 'Parallel builds', model: 'Sonnet ×2', does: 'Both versions written at once', parallel: ['Kinetic HTML', 'AMP4Email'] },
  { name: 'QA', model: 'Haiku + AMP validator', does: '30 + 24 checks; both must pass' },
  { name: 'Curator', model: 'Haiku', does: 'Scores the pair and approves it' },
];

export function KineticPipelineDiagram() {
  return (
    <ol
      aria-label="Generation pipeline: brief, blueprint, RAG retrieval, parallel kinetic and AMP builds, QA, curator"
      className="relative grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-2 p-4 rounded-lg shadow-inner"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* The rail the stages sit on */}
      <span aria-hidden="true" className="pipeline-rail absolute md:left-8 md:right-8 md:top-[2.15rem] md:h-0.5 left-[1.95rem] top-8 bottom-8 w-0.5 md:w-auto md:bottom-auto" />
      {STAGES.map((stage, i) => (
        <li key={stage.name} className="relative flex md:flex-col items-start md:items-center gap-3 md:gap-2 md:text-center">
          <span
            className="pipeline-step relative z-10 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{stage.name}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-0.5">{stage.model}</p>
            {stage.parallel && (
              <div className="flex md:flex-col gap-1 mt-1.5 md:items-center">
                {stage.parallel.map((build) => (
                  <span key={build} className="px-1.5 py-0.5 rounded text-[11px] font-medium tech-tag">
                    {build}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">{stage.does}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
