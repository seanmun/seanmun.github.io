'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";


interface PageView {
  id: string;
  cookieId: string;
  timestamp: Date;
  eventType: string;
  geolocation: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function DashboardView() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

        const pageviewsRef = collection(db, 'pageviews');
        const q = query(
          pageviewsRef,
          where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const views: PageView[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            cookieId: data.cookieId,
            timestamp: data.timestamp.toDate(),
            eventType: data.eventType,
            geolocation: data.geolocation,
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
  }, []);

  if (loading) return <div>Loading analytics data...</div>;
  if (error) return <div>Error loading analytics: {error}</div>;

  // Process data for charts
  const chartData = pageViews.map(view => ({
    timestamp: view.timestamp,
    visits: 1
  }));

  // Unique visitors count
  const uniqueVisitors = new Set(pageViews.map(view => view.cookieId)).size;

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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">Total Pageviews</h3>
          <p className="text-3xl font-bold dark:text-white">{pageViews.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">Unique Visitors</h3>
          <p className="text-3xl font-bold dark:text-white">{uniqueVisitors}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">Locations Tracked</h3>
          <p className="text-3xl font-bold dark:text-white">
            {pageViews.filter(view => view.geolocation).length}
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