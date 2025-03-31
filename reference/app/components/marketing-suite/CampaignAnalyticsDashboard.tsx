'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface CampaignMetrics {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface CampaignAnalyticsDashboardProps {
  campaignName: string;
  metrics: CampaignMetrics[];
  totalBudget: number;
  spentBudget: number;
}

export const CampaignAnalyticsDashboard = ({
  campaignName,
  metrics,
  totalBudget,
  spentBudget,
}: CampaignAnalyticsDashboardProps) => {
  const [activeMetric, setActiveMetric] = useState<'impressions' | 'clicks' | 'conversions'>('impressions');

  const budgetPercentage = (spentBudget / totalBudget) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{campaignName}</h2>
          <p className="text-gray-500">Campaign Performance Overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">Budget Spent</p>
            <p className="text-lg font-semibold text-gray-800">
              ${spentBudget.toLocaleString()} / ${totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="w-20 h-20 relative">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                className="text-gray-200"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
                r="35"
                cx="40"
                cy="40"
              />
              <circle
                className="text-blue-600"
                strokeWidth="5"
                strokeDasharray={220}
                strokeDashoffset={220 - (220 * budgetPercentage) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="35"
                cx="40"
                cy="40"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold">{Math.round(budgetPercentage)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        {(['impressions', 'clicks', 'conversions'] as const).map((metric) => (
          <motion.button
            key={metric}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveMetric(metric)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeMetric === metric
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </motion.button>
        ))}
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['impressions', 'clicks', 'conversions'] as const).map((metric) => {
          const total = metrics.reduce((sum, item) => sum + item[metric], 0);
          return (
            <div key={metric} className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm">{metric.charAt(0).toUpperCase() + metric.slice(1)}</p>
              <p className="text-2xl font-bold text-gray-800">{total.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 