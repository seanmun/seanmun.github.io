'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { TrendingUp, Users, MapPin, Monitor, Smartphone, Tablet, MousePointerClick } from 'lucide-react';


interface PageView {
  id: string;
  cookieId: string;
  timestamp: Date;
  eventType: 'pageview' | 'project_click' | 'modal_open' | 'link_click';
  geolocation: {
    latitude: number;
    longitude: number;
  } | null;
  projectName?: string;
  modalName?: string;
  linkName?: string;
  linkUrl?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
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

  useEffect(() => {
    async function fetchData() {
      try {
        const pageviewsRef = collection(db, 'pageviews');
        let q;

        if (dateRange === 0) {
          // All time - no date filter
          q = query(
            pageviewsRef,
            orderBy('timestamp', 'desc')
          );
        } else {
          // Filtered by date range
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - dateRange);
          q = query(
            pageviewsRef,
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            orderBy('timestamp', 'desc')
          );
        }

        const snapshot = await getDocs(q);
        const views: PageView[] = snapshot.docs.map(doc => {
          const data = doc.data();

          // Handle different timestamp formats
          let timestamp: Date;
          if (data.timestamp?.toDate) {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp instanceof Date) {
            timestamp = data.timestamp;
          } else if (data.createdAt?.toDate) {
            timestamp = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            timestamp = data.createdAt;
          } else {
            timestamp = new Date();
          }

          return {
            id: doc.id,
            cookieId: data.cookieId,
            timestamp,
            eventType: data.eventType || 'pageview',
            geolocation: data.geolocation,
            projectName: data.projectName,
            modalName: data.modalName,
            linkName: data.linkName,
            linkUrl: data.linkUrl,
            deviceType: data.deviceType,
            userAgent: data.userAgent,
          };
        });

        setPageViews(views);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  if (loading) return <div className="text-white">Loading analytics data...</div>;
  if (error) return <div className="text-white">Error loading analytics: {error}</div>;

  // Filter by event types
  const pageviewsOnly = pageViews.filter(v => v.eventType === 'pageview');
  const projectClicks = pageViews.filter(v => v.eventType === 'project_click');
  const modalOpens = pageViews.filter(v => v.eventType === 'modal_open');
  const linkClicks = pageViews.filter(v => v.eventType === 'link_click');

  // Process data for charts
  const chartData = pageViews.map(view => ({
    timestamp: view.timestamp,
    visits: 1
  }));

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

  // Project click stats
  const projectClickCounts = projectClicks.reduce((acc, click) => {
    const project = click.projectName || 'Unknown';
    acc[project] = (acc[project] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topProjects = Object.entries(projectClickCounts)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Modal open stats
  const modalOpenCounts = modalOpens.reduce((acc, open) => {
    const modal = open.modalName || 'Unknown';
    acc[modal] = (acc[modal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topModals = Object.entries(modalOpenCounts)
    .map(([name, opens]) => ({ name, opens }))
    .sort((a, b) => b.opens - a.opens);

  // Link click stats
  const linkClickCounts = linkClicks.reduce((acc, click) => {
    const link = click.linkName || 'Unknown';
    acc[link] = (acc[link] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLinks = Object.entries(linkClickCounts)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  // Time of day distribution
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    visits: pageViews.filter(view => 
      new Date(view.timestamp).getHours() === hour
    ).length
  }));

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

  const worldGeoUrl = "/maps/world.json";
  const usGeoUrl = "/maps/us-states.json";

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
            <h3 className="text-sm font-semibold opacity-90">Project Clicks</h3>
            <MousePointerClick className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedCounter value={projectClicks.length} />
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">Locations Tracked</h3>
            <MapPin className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedCounter value={pageViews.filter(view => view.geolocation).length} />
          </p>
        </div>
      </div>

      {/* Pageviews Over Time */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Pageviews Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time of Day Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Visits by Hour</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(hour) => `${hour}:00 - ${hour+1}:00`}
              />
              <Bar dataKey="visits" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
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

      {/* Engagement Section - Projects, Modals, Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects */}
        {topProjects.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Most Clicked Projects</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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
      </div>

      {/* Top Links */}
      {topLinks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Most Clicked Links</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLinks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="clicks" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Geolocation Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* World Map */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-4 dark:text-white">Global Visitor Locations</h3>
    <div className="h-[400px]">
      <ComposableMap>
        <ZoomableGroup zoom={1}>
          <Geographies geography={worldGeoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.properties.name}
                  geography={geo}
                  fill="#D6D6DA"
                  stroke="#9CA3AF"
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#A9A9A9", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {pageViews
            .filter(view => view.geolocation)
            .map((view, index) => (
              <Marker
                key={index}
                coordinates={[view.geolocation!.longitude, view.geolocation!.latitude]}
              >
                <circle r={4} fill="#EF4444" />
              </Marker>
            ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  </div>

{/* US Map */}
<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4 dark:text-white">US Visitor Locations</h3>
  <div className="h-[400px]">
    <ComposableMap
      projection="geoAlbersUsa"
      projectionConfig={{
        scale: 1200
      }}
    >
      <ZoomableGroup>
        <Geographies geography={usGeoUrl} onError={(error) => console.log("Map error:", error)}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.id}
                geography={geo}
                fill="#D6D6DA"
                stroke="#9CA3AF"
                style={{
                  default: {
                    fill: "#D6D6DA",
                    stroke: "#9CA3AF",
                    outline: "none"
                  },
                  hover: {
                    fill: "#A9A9A9",
                    outline: "none"
                  }
                }}
              />
            ))
          }
        </Geographies>
        {pageViews
          .filter(view => view.geolocation)
          .filter(view => 
            view.geolocation!.latitude >= 24 && 
            view.geolocation!.latitude <= 50 &&
            view.geolocation!.longitude >= -125 && 
            view.geolocation!.longitude <= -65
          )
          .map((view, index) => (
            <Marker
              key={index}
              coordinates={[view.geolocation!.longitude, view.geolocation!.latitude]}
            >
              <circle r={4} fill="#EF4444" />
            </Marker>
          ))}
      </ZoomableGroup>
    </ComposableMap>
  </div>
</div>

</div>

    </div>
  );
}