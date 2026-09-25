'use client';
// File: src/components/ui/GitActivity.tsx
// Purpose: Live commit activity from GitHub (see lib/github-stats.ts).
// Relative times ("3 days ago") are computed after mount, never on the
// server, because the page HTML is cached for up to an hour.

import React, { useEffect, useState } from 'react';
import type { GitStatsSnapshot, ProjectGitStats } from '@/lib/github-stats';

// Cards only advertise activity this fresh; older projects show nothing extra
const FRESH_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  return now;
}

function formatAgo(iso: string, now: number) {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < FRESH_DAYS) return `${Math.round(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// 2,024 -> "2,000+", 591 -> "590+", 44 -> "44"
function formatCount(n: number) {
  if (n < 100) return n.toLocaleString('en-US');
  const step = n < 1000 ? 10 : 100;
  const floored = Math.floor(n / step) * step;
  return `${floored.toLocaleString('en-US')}${n > floored ? '+' : ''}`;
}

const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

function PulseDot() {
  return <span className="git-pulse-dot flex-shrink-0" aria-hidden="true" />;
}

// Card badge: "Updated 3 days ago", only for recently active projects
export function UpdatedBadge({ stats }: { stats?: ProjectGitStats }) {
  const now = useNow();
  if (!stats || now === null) return null;
  if (now - new Date(stats.lastCommitAt).getTime() > FRESH_DAYS * DAY_MS) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
      title={`${plural(stats.recentCommits, 'commit')} in the last 90 days`}
    >
      <PulseDot />
      Updated {formatAgo(stats.lastCommitAt, now)}
    </span>
  );
}

// Home page summary above the grid
export function GitSummaryLine({ snapshot }: { snapshot: GitStatsSnapshot }) {
  return (
    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 mb-4">
      <PulseDot />
      <span>
        {formatCount(snapshot.totalCommits)} commits across these projects
        {snapshot.recentCommits > 0 && <> · {formatCount(snapshot.recentCommits)} in the last 90 days</>}
      </span>
    </p>
  );
}

// Feature page stats: recent + all-time counts and last commit
export function GitStatsLine({ stats }: { stats: ProjectGitStats }) {
  const now = useNow();
  const isFresh = now !== null && now - new Date(stats.lastCommitAt).getTime() <= FRESH_DAYS * DAY_MS;

  const parts = [
    stats.recentCommits > 0 ? `${plural(stats.recentCommits, 'commit')} in the last 90 days` : null,
    stats.recentCommits > 0 ? `${stats.totalCommits.toLocaleString('en-US')} all-time` : plural(stats.totalCommits, 'commit'),
    now !== null ? `last commit ${formatAgo(stats.lastCommitAt, now)}` : null,
  ].filter(Boolean);

  return (
    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
      {isFresh && <PulseDot />}
      <span>{parts.join(' · ')}</span>
    </p>
  );
}
