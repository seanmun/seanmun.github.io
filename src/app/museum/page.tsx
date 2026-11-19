// File: src/app/museum/page.tsx
// Purpose: The 3D museum. Work in progress on seanmun/update, kept out of
// search results until it replaces the home page.

import type { Metadata } from 'next';
import { readdirSync } from 'fs';
import path from 'path';
import { projects, type Project } from '@/data/projects';
import { getGitStats, type ProjectGitStats } from '@/lib/github-stats';
import {
  PLACARD_SLUGS, ROOM_SLUGS, roomTour,
  type MuseumProject, type PanelContent, type TourStop,
} from '@/components/museum/layout';
import MuseumClient from '@/components/museum/MuseumClient';

export const metadata: Metadata = {
  title: 'The Museum | Sean Munley',
  description: 'Walk through a 3D museum of my work: a gallery of basketball art, then a room for every project.',
  robots: { index: false, follow: true },
};

// Commit stats on the tour panels; refresh hourly like the project pages
export const revalidate = 3600;

// OrdinalFrame's screen shows every image in this folder, in filename
// order. Drop inscriptions in and redeploy; with none, it shows stand-ins.
function ordinalImages() {
  try {
    return readdirSync(path.join(process.cwd(), 'public/media/museum/ordinals'))
      .filter((f) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f))
      .sort()
      .map((f) => `/media/museum/ordinals/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

// Whole sentences up to a length: panels are read standing up, not studied
function sentences(text: string, max: number) {
  const parts = text.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [text];
  let out = '';
  for (const part of parts) {
    if (out && (out + part).length > max) break;
    out += part;
  }
  return out.trim();
}

// Short bullets as written; when a section only has long ones, cut them at
// a natural break (a colon, dash or semicolon) rather than mid-thought
function trimBullet(b: string, max: number) {
  if (b.length <= max) return b;
  const cut = b.slice(0, max).search(/(: | — | – |; |\. )(?!.*(: | — | – |; |\. ))/);
  if (cut > 40) return b.slice(0, cut).replace(/[:;—–]$/, '').trim();
  return `${b.slice(0, b.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '')}…`;
}

function pickBullets(bullets: string[] | undefined, n: number, max = 125) {
  const all = bullets ?? [];
  const short = all.filter((b) => b.length <= max);
  return (short.length >= n ? short : all.map((b) => trimBullet(b, max))).slice(0, n);
}

const STATUS: Record<string, string> = { Prod: 'Live', MVP: 'MVP', Dev: 'In development' };

function panelFor(p: Project, stop: TourStop, k: number, count: number, stats?: ProjectGitStats): PanelContent {
  const kicker = `${p.title} · ${k + 1} of ${count}`;
  const sections = p.modalContent?.detailSections ?? [];
  const section = (heading?: string) => sections.find((s) => s.heading === heading);
  const caseStudy = { label: 'Read the case study', href: `/projects/${p.slug}` };
  const base: PanelContent = { kicker, title: '', body: '', bullets: [], chips: [], stats: [], links: [] };

  switch (stop.panel.kind) {
    case 'overview':
      return {
        ...base,
        title: p.title,
        body: sentences(p.modalContent?.overview ?? p.description, 300),
        chips: [STATUS[p.status] ?? p.status, ...p.techStack.slice(0, 6)],
      };
    case 'section': {
      const s = section(stop.panel.heading);
      return { ...base, title: s?.heading ?? stop.label, body: sentences(s?.body ?? '', 240), bullets: pickBullets(s?.bullets, 3) };
    }
    case 'finale': {
      const s = section(stop.panel.heading);
      const statRows = stats
        ? [
            { label: 'Commits', value: stats.totalCommits.toLocaleString('en-US') },
            { label: 'Last 90 days', value: stats.recentCommits.toLocaleString('en-US') },
            { label: 'Repos', value: String(p.repos?.length ?? 1) },
          ]
        : [];
      return {
        ...base,
        title: s?.heading ?? 'Under the hood',
        body: sentences(s?.body ?? '', 220),
        bullets: pickBullets(s?.bullets, 2),
        stats: statRows,
        links: [
          ...(stop.panel.link ? [{ ...stop.panel.link, external: true }] : []),
          ...(p.link ? [{ label: `Visit ${new URL(p.link).hostname.replace(/^www\./, '')}`, href: p.link, external: true }] : []),
          caseStudy,
          { label: 'Work with me', href: '/#work-with-me' },
        ],
      };
    }
  }
}

export default async function MuseumPage() {
  // Only what the placards show, so the client bundle doesn't carry projects.ts
  const rooms: MuseumProject[] = projects
    .filter((p) => PLACARD_SLUGS.includes(p.slug))
    .map(({ slug, title, description, status, techStack, link }) => ({ slug, title, description, status, techStack, link }));

  const gitStats = await getGitStats();
  const tours: Record<string, PanelContent[]> = {};
  ROOM_SLUGS.forEach((slug, i) => {
    const tour = roomTour(slug, i);
    const p = projects.find((x) => x.slug === slug);
    if (!tour || !p) return;
    tours[slug] = tour.map((stop, k) => panelFor(p, stop, k, tour.length, gitStats?.byProject[slug]));
  });

  return <MuseumClient projects={rooms} ordinals={ordinalImages()} tours={tours} />;
}
