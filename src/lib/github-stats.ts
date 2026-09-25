// File: src/lib/github-stats.ts
// Purpose: Commit activity for the project cards, pulled from GitHub.
// Server-only: reads GITHUB_TOKEN (a read-only fine-grained token) and runs
// one GraphQL query covering every repo listed in projects.ts. Pages that
// call this revalidate hourly, so visitors never hit GitHub directly.
// Any failure (missing token, GitHub down, renamed repo) degrades to no
// stats rather than breaking the page.

import { projects } from '@/data/projects';

const GITHUB_OWNER = 'seanmun';
const RECENT_WINDOW_DAYS = 90;

export interface ProjectGitStats {
  totalCommits: number;
  recentCommits: number; // commits in the last RECENT_WINDOW_DAYS
  lastCommitAt: string; // ISO timestamp of the newest default-branch commit
}

export interface GitStatsSnapshot {
  byProject: Record<string, ProjectGitStats>; // keyed by project slug
  totalCommits: number; // across every listed repo, including hidden projects
  recentCommits: number;
}

interface RepoNode {
  defaultBranchRef: {
    target: {
      committedDate: string;
      total: { totalCount: number };
      recent: { totalCount: number };
    } | null;
  } | null;
}

export async function getGitStats(): Promise<GitStatsSnapshot | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const repoNames = [...new Set(projects.flatMap((p) => p.repos ?? []))];
  if (repoNames.length === 0) return null;

  // Window starts at midnight UTC so the query text is stable all day
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - RECENT_WINDOW_DAYS);

  const query = `query {
${repoNames
  .map(
    (name, i) => `  r${i}: repository(owner: ${JSON.stringify(GITHUB_OWNER)}, name: ${JSON.stringify(name)}) {
    defaultBranchRef { target { ... on Commit {
      committedDate
      total: history { totalCount }
      recent: history(since: ${JSON.stringify(since.toISOString())}) { totalCount }
    } } }
  }`
  )
  .join('\n')}
}`;

  let data: Record<string, RepoNode | null>;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`GitHub stats request failed: ${res.status}`);
      return null;
    }
    const json = await res.json();
    // Partial errors (e.g. a renamed repo) still return data for the rest
    if (json.errors) console.error('GitHub stats partial errors:', json.errors);
    if (!json.data) return null;
    data = json.data;
  } catch (err) {
    console.error('GitHub stats unavailable:', err);
    return null;
  }

  const repoStats = new Map<string, ProjectGitStats>();
  repoNames.forEach((name, i) => {
    const commit = data[`r${i}`]?.defaultBranchRef?.target;
    if (!commit) return;
    repoStats.set(name, {
      totalCommits: commit.total.totalCount,
      recentCommits: commit.recent.totalCount,
      lastCommitAt: commit.committedDate,
    });
  });

  const byProject: Record<string, ProjectGitStats> = {};
  for (const project of projects) {
    if (project.showGitStats === false) continue;
    const stats = (project.repos ?? []).flatMap((name) => repoStats.get(name) ?? []);
    if (stats.length === 0) continue;
    byProject[project.slug] = {
      totalCommits: stats.reduce((sum, s) => sum + s.totalCommits, 0),
      recentCommits: stats.reduce((sum, s) => sum + s.recentCommits, 0),
      lastCommitAt: stats.map((s) => s.lastCommitAt).sort().at(-1)!,
    };
  }

  const allRepos = [...repoStats.values()];
  return {
    byProject,
    totalCommits: allRepos.reduce((sum, s) => sum + s.totalCommits, 0),
    recentCommits: allRepos.reduce((sum, s) => sum + s.recentCommits, 0),
  };
}
