'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Monitor, Smartphone, Tablet, Clock, ExternalLink, UserMinus, UserPlus } from 'lucide-react';
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
  eventType: 'pageview' | 'project_click' | 'modal_open' | 'link_click';
  path?: string | null;
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

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      countRef.current = Math.floor(progress * value);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function DashboardView() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<number>(45);
  const [visitors, setVisitors] = useState<VisitorSummary[]>([]);
  const [thisBrowser, setThisBrowser] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // The server records whoever opens the dashboard as an admin so
        // these visits are excluded from the numbers. getVisitorId creates
        // the id if this browser has never loaded the site itself —
        // otherwise this browser would stay uncounted as yours.
        const visitorId = getVisitorId();
        setThisBrowser(visitorId);
        const params = new URLSearchParams({ days: String(dateRange) });
        if (visitorId) params.set('visitorId', visitorId);

        const res = await fetch(`/api/dashboard/data?${params}`);
        if (!res.ok) throw new Error(res.status === 401 ? 'Session expired — reload and log in again' : 'Failed to load analytics');

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
  }, [dateRange, reloadKey]);

  // Mark a browser as Sean's (or undo it), then refetch so the numbers move
  const setAdminVisitor = async (cookieId: string, isAdmin: boolean) => {
    await fetch('/api/dashboard/admin-visitors', {
      method: isAdmin ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: cookieId }),
    });
    setReloadKey((key) => key + 1);
  };

  if (loading) return <div className="text-white">Loading analytics data...</div>;
  if (error) return <div className="text-white">Error loading analytics: {error}</div>;

  // Filter by event types
  const pageviewsOnly = pageViews.filter(v => v.eventType === 'pageview');
  const modalOpens = pageViews.filter(v => v.eventType === 'modal_open');

  // Unique visitors count
  const uniqueVisitors = new Set(pageviewsOnly.map(view => view.cookieId)).size;

  // Device breakdown
  const deviceCounts = pageviewsOnly.reduce((acc, view) => {
    const device = view.deviceType || 'desktop';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = [
    { name: 'Desktop', value: deviceCounts.desktop || 0, icon: Monitor },
    { name: 'Mobile', value: deviceCounts.mobile || 0, icon: Smartphone },
    { name: 'Tablet', value: deviceCounts.tablet || 0, icon: Tablet }
  ].filter(d => d.value > 0);

  // Modal open stats
  const modalOpenCounts = modalOpens.reduce((acc, open) => {
    const modal = open.modalName || 'Unknown';
    acc[modal] = (acc[modal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topModals = Object.entries(modalOpenCounts)
    .map(([name, opens]) => ({ name, opens }))
    .sort((a, b) => b.opens - a.opens);

  // Visitor frequency (return rate)
  const visitorFrequency = Object.values(
    pageViews.reduce((acc, view) => {
      acc[view.cookieId] = (acc[view.cookieId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).reduce((acc, visits) => {
    const key = visits === 1 ? 'New' : 'Returning';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visitorTypeData = [
    { name: 'New', value: visitorFrequency['New'] || 0 },
    { name: 'Returning', value: visitorFrequency['Returning'] || 0 }
  ];

  // Referrer stats
  const referrerCounts = pageviewsOnly.reduce((acc, view) => {
    let referrer = view.referrer || 'direct';

    // Clean up referrer - extract domain
    if (referrer !== 'direct' && referrer.startsWith('http')) {
      try {
        const url = new URL(referrer);
        referrer = url.hostname.replace('www.', '');
      } catch {
        // Keep as is if URL parsing fails
      }
    }

    acc[referrer] = (acc[referrer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topReferrers = Object.entries(referrerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average time on site (only for sessions with timeOnSite data)
  const timeOnSiteData = pageviewsOnly.filter(v => v.timeOnSite && v.timeOnSite > 0);
  const avgTimeOnSite = timeOnSiteData.length > 0
    ? Math.floor(timeOnSiteData.reduce((sum, v) => sum + (v.timeOnSite || 0), 0) / timeOnSiteData.length)
    : 0;

  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange(7)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 7
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange(30)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 30
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange(45)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 45
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            45 Days
          </button>
          <button
            onClick={() => setDateRange(90)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 90
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setDateRange(0)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">Total Pageviews</h3>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedCounter value={pageviewsOnly.length} />
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">Unique Visitors</h3>
            <Users className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedCounter value={uniqueVisitors} />
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">Avg. Time on Site</h3>
            <Clock className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {formatTime(avgTimeOnSite)}
          </p>
        </div>
      </div>

      {/* Two column layout for Visitor Types and Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Type Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Visitor Types</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitorTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visitorTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Device Types</h3>
          <div className="h-80 flex items-center justify-center">
            <div className="w-full max-w-md space-y-4">
              {deviceData.map((device, index) => {
                const Icon = device.icon;
                const total = deviceData.reduce((sum, d) => sum + d.value, 0);
                const percentage = ((device.value / total) * 100).toFixed(1);
                return (
                  <div key={device.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium dark:text-white">{device.name}</span>
                      </div>
                      <span className="text-sm font-bold dark:text-white">
                        {device.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-1000"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Section - Modals and Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Modals */}
        {topModals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Most Opened Modals</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topModals} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="opens" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Referrers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Top Traffic Sources
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topReferrers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Whose visits count — exclusion is per browser, so a device that has
          never opened the dashboard shows up here as an ordinary visitor */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-1 dark:text-white">Browsers seen</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Excluded browsers are yours and are already filtered out of every number above.
          If one of your own devices is listed as a visitor, mark it.
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visitors.map((visitor) => {
            const days = Math.max(
              0,
              Math.round((new Date(visitor.lastSeen).getTime() - new Date(visitor.firstSeen).getTime()) / 86400000)
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