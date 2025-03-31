'use client';

import { 
  ArrowTrendingUpIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ProductFeedMetrics {
  date: string;
  activeProducts: number;
  disapproved: number;
  pending: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export default function MerchantCenterDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');

  // Sample data - replace with real API data
  const productMetrics: ProductFeedMetrics[] = [
    {
      date: '2024-01-01',
      activeProducts: 1200,
      disapproved: 45,
      pending: 23,
      clicks: 3200,
      impressions: 45000,
      conversions: 128,
    },
    // Add more sample data points
  ];

  const feedHealth = {
    total: 1268,
    active: 1200,
    disapproved: 45,
    pending: 23,
    issues: [
      {
        severity: 'critical',
        message: 'Missing GTIN for 15 products',
        affected: 15,
      },
      {
        severity: 'warning',
        message: 'Incomplete product descriptions',
        affected: 28,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Google Merchant Center Dashboard
        </h1>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4">
            {['overview', 'products', 'performance', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedView(tab)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedView === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Products</h3>
              <ShoppingBagIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{feedHealth.active}</p>
            <p className="text-sm text-gray-500 mt-2">
              {((feedHealth.active / feedHealth.total) * 100).toFixed(1)}% of total products
            </p>
          </div>

          {/* Add more metric cards */}
        </div>

        {/* Feed Health Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Feed Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">Critical Issues</h3>
              {feedHealth.issues
                .filter((issue) => issue.severity === 'critical')
                .map((issue, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                      <p className="text-sm text-gray-500">{issue.affected} products affected</p>
                    </div>
                  </div>
                ))}
            </div>
            {/* Add warning and optimization sections */}
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Click Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#4F46E5"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Conversion Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversions" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended Actions</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Optimize product titles for better visibility
                </p>
                <p className="text-sm text-gray-500">
                  28 products need attention
                </p>
              </div>
            </div>
            {/* Add more action items */}
          </div>
        </div>
      </div>
    </div>
  );
} 