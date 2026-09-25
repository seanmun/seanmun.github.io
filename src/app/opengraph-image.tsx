// File: src/app/opengraph-image.tsx
// Purpose: The card seanmun.com unfurls into when shared. Same language as
// the project cards, plus the live commit count — the card is generated on
// the server, so the proof stays current without anyone editing it.

import fs from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';
import { projects } from '@/data/projects';
import { getGitStats } from '@/lib/github-stats';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Sean Munley — Product Builder & AI Consultant';

const SERVICES = ['AI Systems', 'Product & MVP', 'CRM & Email', 'Devices'];

// Inlined as a data URI: reading the file beats fetching our own URL while
// the page that serves it is still being built
function profileDataUri() {
  try {
    const file = fs.readFileSync(path.join(process.cwd(), 'public/profile/smunley2019.png'));
    return `data:image/png;base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const stats = await getGitStats().catch(() => null);
  const photo = profileDataUri();

  const commits = stats ? Math.floor(stats.totalCommits / 100) * 100 : null;
  const proof = commits
    ? `${projects.length} projects · ${commits.toLocaleString('en-US')}+ commits`
    : `${projects.length} projects shipped end-to-end`;

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

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36 }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo}
              width={148}
              height={148}
              alt=""
              style={{ borderRadius: 999, border: '3px solid #2a78d6', objectFit: 'cover' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 22, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 3 }}>
              seanmun.com
            </span>
            <span style={{ fontSize: 72, color: '#ffffff', fontWeight: 700, lineHeight: 1.1, marginTop: 8 }}>
              Sean Munley
            </span>
            <span style={{ fontSize: 34, color: '#e2e8f0', marginTop: 12 }}>
              I turn wild ideas into working products.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <span style={{ fontSize: 26, color: '#c3c2b7', lineHeight: 1.4, maxWidth: 940 }}>
            Sites, apps, AI systems, and devices — a decade of enterprise CRM discipline, now pointed at anything you can imagine.
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {SERVICES.map((service) => (
                <span
                  key={service}
                  style={{
                    fontSize: 20,
                    color: '#c3c2b7',
                    border: '1px solid #334155',
                    padding: '6px 14px',
                    borderRadius: 8,
                  }}
                >
                  {service}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 22, color: '#1baf7a' }}>{proof}</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
