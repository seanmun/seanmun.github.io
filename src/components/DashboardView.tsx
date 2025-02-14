'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

// Function to group pageviews by location
function groupByLocation(pageViews: PageView[]) {
  const locationMap = new Map();
  
  pageViews.forEach(view => {
    if (view.geolocation) {
      const key = `${view.geolocation.latitude.toFixed(2)},${view.geolocation.longitude.toFixed(2)}`;
      if (locationMap.has(key)) {
        locationMap.set(key, {
          ...locationMap.get(key),
          count: locationMap.get(key).count + 1
        });
      } else {
        locationMap.set(key, {
          latitude: view.geolocation.latitude,
          longitude: view.geolocation.longitude,
          count: 1
        });
      }
    }
  });
  
  return Array.from(locationMap.values());
}

export default function DashboardView() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const uniqueVisitors = new Set(pageViews.map(view => view.cookieId)).size;
  const locationGroups = groupByLocation(pageViews);


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Total Pageviews</h2>
          </div>
          <div className="p-6">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{pageViews.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Unique Visitors</h2>
          </div>
          <div className="p-6">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{uniqueVisitors}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Unique Locations</h2>
          </div>
          <div className="p-6">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{locationGroups.length}</p>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Geographic Distribution</h2>
        </div>
        <div className="p-4 h-96">
          <div className="relative w-full h-full">
            {locationGroups.map((location, index) => {
              // Convert lat/lng to x/y coordinates (simple mercator projection)
              const x = ((location.longitude + 180) * 100) / 360;
              const y = ((90 - location.latitude) * 100) / 180;

              return (
                <div
                  key={index}
                  className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    opacity: Math.min(0.2 + (location.count / pageViews.length), 1)
                  }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
                    {location.count} views
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pageviews Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Pageviews Over Time</h2>
        </div>
        <div className="p-4 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pageViews}>
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
                dataKey="count" 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}