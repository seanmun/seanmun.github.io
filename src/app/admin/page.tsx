'use client'

import { useState, useEffect } from 'react'

interface PageView {
  cookieId: string;
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  eventType: 'pageview';
}

interface AnalyticsData {
  totalVisits: number;
  pageviews: PageView[];
}

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics()
    }
  }, [isAuthenticated])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_MAINTENANCE_PASSWORD) {
      setIsAuthenticated(true)
      setPassword('')
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter password"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Analytics Dashboard</h1>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Visits</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analyticsData?.totalVisits || 0}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Unique Visitors</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analyticsData?.pageviews ? new Set(analyticsData.pageviews.map(pv => pv.cookieId)).size : 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Locations Tracked</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analyticsData?.pageviews ? analyticsData.pageviews.filter(pv => pv.geolocation).length : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard