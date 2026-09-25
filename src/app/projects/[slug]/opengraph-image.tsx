// File: src/app/projects/[slug]/opengraph-image.tsx
// Purpose: The card a project link unfurls into on LinkedIn, Slack, iMessage.
// Generated per project so a shared link shows the work rather than a
// profile photo. Next picks this up by filename; the page's generateMetadata
// deliberately does not set its own og:image.

import { ImageResponse } from 'next/og';
import { projects, statusConfig } from '@/data/projects';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Project by Sean Munley';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  const title = project?.title ?? 'Sean Munley';
  const status = project ? statusConfig[project.status].label : '';
  const stack = project?.techStack.slice(0, 6) ?? [];
  const overview = project?.modalContent?.overview ?? project?.description ?? '';
  const summary = overview ? `${overview.slice(0, 150).trimEnd()}…` : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0b1120',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        {/* The site's blue -> green gradient, as a band across the top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: 'linear-gradient(90deg, #2a78d6 0%, #22d3ee 50%, #1baf7a 100%)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <span
              style={{
                fontSize: 22,
                color: '#93c5fd',
                textTransform: 'uppercase',
                letterSpacing: 3,
              }}
            >
              seanmun.com
            </span>
            {status && (
              <span
                style={{
                  fontSize: 20,
                  color: '#0b1120',
                  background: '#1baf7a',
                  padding: '4px 14px',
                  borderRadius: 999,
                }}
              >
                {status}
              </span>
            )}
          </div>

          <div style={{ fontSize: 76, color: '#ffffff', fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>

          {summary && (
            <div style={{ fontSize: 28, color: '#c3c2b7', marginTop: 24, lineHeight: 1.4 }}>
              {summary}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 780 }}>
            {stack.map((tech) => (
              <span
                key={tech}
                style={{
                  fontSize: 20,
                  color: '#c3c2b7',
                  border: '1px solid #334155',
                  padding: '6px 14px',
                  borderRadius: 8,
                }}
              >
                {tech}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 24, color: '#93c5fd' }}>Sean Munley</div>
        </div>
      </div>
    ),
    size
  );
}
