'use client';
// File: src/components/DashboardView.tsx
// Purpose: Site analytics. Headline numbers, visits over time, then a chart
// per dimension — what was clicked, which pages, where traffic came from,
// which panels were opened — and the visit-by-visit feed underneath.

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { UserMinus, UserPlus } from 'lucide-react';
import { getVisitorId } from '@/lib/track-utils';

interface VisitorSummary {
  cookieId: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  devices: string[];
  isAdmin: boolean;
}

interface PageView {
  id: string;
  cookieId: string;
  timestamp: Date;
  eventType: 'pageview' | 'project_click' | 'modal_open' | 'link_click' | 'click';
  path?: string | null;
  label?: string | null;
  elementKind?: string | null;
  section?: string | null;
  href?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  isBot?: boolean;
  projectName?: string;
  modalName?: string;
  linkName?: string;
  linkUrl?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
  referrer?: string;
  timeOnSite?: number;
}

const DAY_MS = 86400000;
const SESSION_GAP_MS = 30 * 60 * 1000;

// Sequential blue from the validated palette, stepped per surface. One hue
// everywhere: bar length already encodes magnitude, so hue stays free.
const SERIES = { light: '#2a78d6', dark: '#3987e5' };
const GRID = { light: '#e7e5e4', dark: '#3f3f46' };
const AXIS_TEXT = { light: '#52514e', dark: '#c3c2b7' };
const SURFACE = { light: '#ffffff', dark: '#1f2937' };

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const read = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark' || document.documentElement.classList.contains('dark'));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const prettyPath = (path: string | null | undefined) => {
  if (!path || path === '/') return 'Home';
  const slug = path.replace(/^\/projects\//, '');
  return slug === path ? path : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const hostOf = (referrer?: string) => {
  if (!referrer || referrer === 'direct') return 'Direct';
  try {
    return new URL(referrer).hostname.replace('www.', '');
  } catch {
    return referrer;
  }
};

const formatDuration = (seconds: number) => {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  return mins > 0 ? `${mins}m ${seconds % 60}s` : `${seconds}s`;
};

const truncate = (value: string, max = 28) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

// Horizontal bars: long category names read straight across, and rows grow
// with the data instead of squeezing into a fixed height.
function BarPanel({
  title,
  subtitle,
  rows,
  empty,
  isDark,
}: {
  title: string;
  subtitle?: string;
  rows: { key: string; count: number }[];
  empty: string;
  isDark: boolean;
}) {
  const data = rows.slice(0, 8).map((row) => ({ ...row, short: truncate(row.key) }));
  const hue = isDark ? SERIES.dark : SERIES.light;
  const height = data.length * 34 + 34;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 self-start">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">{empty}</p>
      ) : (
        <div className="mt-4" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={8}>
              <CartesianGrid stroke={isDark ? GRID.dark : GRID.light} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: isDark ? AXIS_TEXT.dark : AXIS_TEXT.light }}
                tickLine={false}
                axisLine={false}
                height={20}
              />
              <YAxis
                type="category"
                dataKey="short"
                width={150}
                tick={{ fontSize: 12, fill: isDark ? AXIS_TEXT.dark : AXIS_TEXT.light }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                contentStyle={{
                  background: isDark ? SURFACE.dark : SURFACE.light,
                  border: `1px solid ${isDark ? GRID.dark : GRID.light}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: isDark ? '#f9fafb' : '#111827',
                }}
                formatter={(value: number) => [value, 'events']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.key ?? ''}
              />
              <Bar dataKey="count" fill={hue} radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                {data.map((row) => (
                  <Cell key={row.key} fill={hue} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
      {delta != null && Number.isFinite(delta) && (
        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          <span className={delta >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(Math.round(delta))}%
          </span>{' '}
          vs previous period
        </p>
      )}
    </div>
  );
}

export default function DashboardView() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<number>(45);
  const [visitors, setVisitors] = useState<VisitorSummary[]>([]);
  const [thisBrowser, setThisBrowser] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [includeMine, setIncludeMine] = useState(false);
  const isDark = useIsDark();

  useEffect(() => {
    async function fetchData() {
      try {
        // getVisitorId creates the id if this browser has never loaded the
        // site itself, so the server can mark it as Sean's and exclude it
        const visitorId = getVisitorId();
        setThisBrowser(visitorId);

        // Twice the window, so each headline number has a period to compare against
        const params = new URLSearchParams({ days: String(dateRange > 0 ? dateRange * 2 : 0) });
        if (visitorId) params.set('visitorId', visitorId);
        if (includeMine) params.set('includeMine', '1');

        const res = await fetch(`/api/dashboard/data?${params}`);
        if (!res.ok) {
          throw new Error(res.status === 401 ? 'Session expired — reload and log in again' : 'Failed to load analytics');
        }

        const data = await res.json();
        setVisitors(data.visitors ?? []);
        setPageViews(
          (data.events as (Omit<PageView, 'timestamp'> & { timestamp: string })[])
            .map((event) => ({ ...event, timestamp: new Date(event.timestamp) }))
            .filter((event) => !event.isBot)
        );
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchData();
  }, [dateRange, reloadKey, includeMine]);

  const setAdminVisitor = async (cookieId: string, isAdmin: boolean) => {
    await fetch('/api/dashboard/admin-visitors', {
      method: isAdmin ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: cookieId }),
    });
    setReloadKey((key) => key + 1);
  };

  const view = useMemo(() => {
    const cutoff = dateRange > 0 ? Date.now() - dateRange * DAY_MS : 0;
    const current = pageViews.filter((event) => event.timestamp.getTime() >= cutoff);
    const previous = pageViews.filter((event) => event.timestamp.getTime() < cutoff);

    const sessionsOf = (events: PageView[]) => {
      const sessions: {
        cookieId: string; start: Date; end: Date; place: string; device: string;
        referrer: string; isAdmin: boolean;
        steps: { time: Date; kind: string; text: string; href?: string | null }[];
      }[] = [];

      [...events]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .forEach((event) => {
          const open = sessions.find(
            (session) =>
              session.cookieId === event.cookieId &&
              event.timestamp.getTime() - session.end.getTime() < SESSION_GAP_MS
          );
          const step = {
            time: event.timestamp,
            kind: event.eventType,
            text:
              event.eventType === 'pageview'
                ? prettyPath(event.path)
                : event.label ?? event.modalName ?? event.linkName ?? event.eventType,
            href: event.href ?? event.linkUrl ?? null,
          };

          if (open) {
            open.end = event.timestamp;
            open.place = open.place || [event.city, event.region].filter(Boolean).join(', ');
            open.device = open.device || event.deviceType || '';
            open.steps.push(step);
          } else {
            sessions.push({
              cookieId: event.cookieId,
              start: event.timestamp,
              end: event.timestamp,
              place: [event.city, event.region].filter(Boolean).join(', '),
              device: event.deviceType || '',
              referrer: event.referrer ?? 'direct',
              isAdmin: visitors.find((v) => v.cookieId === event.cookieId)?.isAdmin ?? false,
              steps: [step],
            });
          }
        });

      return sessions;
    };

    const rank = (values: (string | null | undefined)[]) => {
      const counts = new Map<string, number>();
      values.forEach((value) => {
        if (!value) return;
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });
      return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    };

    const sessions = sessionsOf(current);
    const pageviews = current.filter((e) => e.eventType === 'pageview');
    const clicks = current.filter((e) => e.eventType === 'click' || e.eventType === 'link_click');
    const modals = current.filter((e) => e.eventType === 'modal_open');
    const durations = sessions
      .map((s) => Math.round((s.end.getTime() - s.start.getTime()) / 1000))
      .filter((seconds) => seconds > 0);

    const prevSessions = sessionsOf(previous);
    const pct = (now: number, before: number) =>
      before === 0 ? (now === 0 ? 0 : 100) : ((now - before) / before) * 100;

    // One point per day across the window, so quiet days read as quiet
    const days = dateRange > 0 ? dateRange : 45;
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      buckets.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), 0);
    }
    sessions.forEach((session) => {
      const key = session.start.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    const trend = [...buckets.entries()].map(([date, visits]) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visits,
    }));

    return {
      sessions: [...sessions].reverse(),
      trend,
      stats: {
        visits: sessions.length,
        visitsDelta: pct(sessions.length, prevSessions.length),
        visitors: new Set(current.map((e) => e.cookieId)).size,
        visitorsDelta: pct(new Set(current.map((e) => e.cookieId)).size, new Set(previous.map((e) => e.cookieId)).size),
        clicks: clicks.length,
        clicksDelta: pct(
          clicks.length,
          previous.filter((e) => e.eventType === 'click' || e.eventType === 'link_click').length
        ),
        avgDuration: durations.length ? Math.round(durations.reduce((sum, s) => sum + s, 0) / durations.length) : 0,
      },
      charts: {
        clicks: rank(clicks.map((e) => e.label ?? e.linkName)),
        pages: rank(pageviews.map((e) => prettyPath(e.path))),
        sources: rank(pageviews.map((e) => hostOf(e.referrer))),
        modals: rank(modals.map((e) => e.modalName)),
        places: rank(current.map((e) => [e.city, e.region ?? e.country].filter(Boolean).join(', ') || null)),
        devices: rank(current.map((e) => e.deviceType)),
      },
    };
  }, [pageViews, dateRange, visitors]);

  if (loading) return <div className="text-gray-600 dark:text-gray-300">Loading analytics…</div>;
  if (error) return <div className="text-red-600 dark:text-red-400">Error loading analytics: {error}</div>;

  const ranges = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 45, label: '45 days' },
    { days: 90, label: '90 days' },
    { days: 0, label: 'All time' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold dark:text-white">Analytics</h2>
        <div className="flex flex-wrap gap-2">
          {ranges.map((range) => (
            <button
              key={range.label}
              onClick={() => setDateRange(range.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range.days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Visits" value={String(view.stats.visits)} delta={dateRange > 0 ? view.stats.visitsDelta : null} />
        <StatTile label="Visitors" value={String(view.stats.visitors)} delta={dateRange > 0 ? view.stats.visitorsDelta : null} />
        <StatTile label="Clicks" value={String(view.stats.clicks)} delta={dateRange > 0 ? view.stats.clicksDelta : null} />
        <StatTile label="Avg. visit" value={formatDuration(view.stats.avgDuration)} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Visits per day
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={view.trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? SERIES.dark : SERIES.light} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={isDark ? SERIES.dark : SERIES.light} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={isDark ? GRID.dark : GRID.light} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: isDark ? AXIS_TEXT.dark : AXIS_TEXT.light }}
                tickLine={false}
                axisLine={{ stroke: isDark ? GRID.dark : GRID.light }}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: isDark ? AXIS_TEXT.dark : AXIS_TEXT.light }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ stroke: isDark ? AXIS_TEXT.dark : AXIS_TEXT.light, strokeWidth: 1 }}
                contentStyle={{
                  background: isDark ? SURFACE.dark : SURFACE.light,
                  border: `1px solid ${isDark ? GRID.dark : GRID.light}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: isDark ? '#f9fafb' : '#111827',
                }}
                formatter={(value: number) => [`${value} visit${value === 1 ? '' : 's'}`, '']}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke={isDark ? SERIES.dark : SERIES.light}
                strokeWidth={2}
                fill="url(#visitsFill)"
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: isDark ? SURFACE.dark : SURFACE.light }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BarPanel
        title="Click activity"
        subtitle="Every element clicked, most clicked first"
        rows={view.charts.clicks}
        empty="No clicks recorded in this range yet."
        isDark={isDark}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarPanel title="Pages" rows={view.charts.pages} empty="No page views in this range." isDark={isDark} />
        <BarPanel title="Traffic sources" rows={view.charts.sources} empty="No traffic in this range." isDark={isDark} />
        <BarPanel title="Panels opened" rows={view.charts.modals} empty="No panels opened in this range." isDark={isDark} />
        <BarPanel title="Places" rows={view.charts.places} empty="No location data yet." isDark={isDark} />
        <BarPanel title="Devices" rows={view.charts.devices} empty="No device data yet." isDark={isDark} />
      </div>

      {/* Individual visits: at a few visits a day, reading them beats any chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Recent visits
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Newest first — pages opened and things clicked, in order.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMine}
              onChange={(e) => setIncludeMine(e.target.checked)}
              className="rounded"
            />
            Include my own visits
          </label>
        </div>

        {view.sessions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No visits in this range. Your own visits are hidden unless you tick the box above.
          </p>
        ) : (
          <div className="space-y-4 max-h-[32rem] overflow-y-auto">
            {view.sessions.slice(0, 40).map((session, index) => {
              const minutes = Math.round((session.end.getTime() - session.start.getTime()) / 60000);
              return (
                <div key={`${session.cookieId}-${index}`} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm mb-1">
                    <span className="font-medium dark:text-white">
                      {session.start.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      · {session.place || 'unknown location'} · {session.device || 'unknown device'}
                      {minutes > 0 && ` · ${minutes} min`} · from {hostOf(session.referrer)}
                    </span>
                    {session.isAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        you
                      </span>
                    )}
                  </div>
                  <ol className="space-y-0.5">
                    {session.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                        <span className="text-gray-400 dark:text-gray-500 tabular-nums text-xs pt-0.5">
                          {step.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <span>
                          {step.kind === 'pageview' ? (
                            <>opened <span className="font-medium text-gray-900 dark:text-white">{step.text}</span></>
                          ) : step.kind === 'modal_open' ? (
                            <>opened the {step.text} panel</>
                          ) : (
                            <>clicked &ldquo;{step.text}&rdquo;{step.href?.startsWith('http') ? ' ↗' : ''}</>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Browsers seen
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
          Excluded browsers are yours and are filtered out of every number above.
        </p>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {visitors.map((visitor) => {
            const days = Math.max(
              0,
              Math.round((new Date(visitor.lastSeen).getTime() - new Date(visitor.firstSeen).getTime()) / DAY_MS)
            );
            return (
              <div
                key={visitor.cookieId}
                className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm dark:text-white">{visitor.cookieId.slice(0, 10)}</span>
                    {visitor.isAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        excluded — yours
                      </span>
                    )}
                    {visitor.cookieId === thisBrowser && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        this browser
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {visitor.count} events over {days} day{days === 1 ? '' : 's'}
                    {visitor.devices.length > 0 && ` · ${visitor.devices.join(', ')}`}
                  </p>
                </div>
                <button
                  onClick={() => setAdminVisitor(visitor.cookieId, !visitor.isAdmin)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {visitor.isAdmin ? (
                    <><UserPlus className="w-3.5 h-3.5" /> Count as visitor</>
                  ) : (
                    <><UserMinus className="w-3.5 h-3.5" /> This is me</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
