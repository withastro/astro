'use client';

import { 
  ArrowTrendingDownIcon, 
  ArrowTrendingUpIcon,
  ChartPieIcon,
  GlobeAltIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface InsightMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
}

interface MarketingInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'audience' | 'engagement' | 'conversion' | 'traffic';
  metrics: InsightMetric[];
  chartData?: ChartData<'line' | 'bar'>;
}

interface MarketingInsightsWidgetProps {
  insights: MarketingInsight[];
  onInsightClick?: (insight: MarketingInsight) => void;
}

const impactColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const categoryIcons = {
  audience: UserGroupIcon,
  engagement: SparklesIcon,
  conversion: ChartPieIcon,
  traffic: GlobeAltIcon,
};

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

export default function MarketingInsightsWidget({ 
  insights,
  onInsightClick 
}: MarketingInsightsWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'date'>('impact');

  const filteredInsights = insights.filter(insight => 
    selectedCategory === 'all' || insight.category === selectedCategory
  );

  const sortedInsights = [...filteredInsights].sort((a, b) => {
    if (sortBy === 'impact') {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    }
    return 0; // Default no sorting
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Marketing Insights</h2>
        <div className="flex space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="audience">Audience</option>
            <option value="engagement">Engagement</option>
            <option value="conversion">Conversion</option>
            <option value="traffic">Traffic</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'impact' | 'date')}
            className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="impact">Sort by Impact</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {sortedInsights.map((insight) => {
          const CategoryIcon = categoryIcons[insight.category];
          
          return (
            <div
              key={insight.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => onInsightClick?.(insight)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <CategoryIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${impactColors[insight.impact]}`}>
                  {insight.impact.toUpperCase()} IMPACT
                </span>
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {insight.metrics.map((metric) => (
                    <div key={metric.label} className="p-3 bg-white rounded-lg">
                      <div className="text-sm text-gray-500">{metric.label}</div>
                      <div className="flex items-center space-x-2">
                        <div className="text-lg font-semibold text-gray-900">
                          {metric.value.toLocaleString()}
                        </div>
                        <div className={`flex items-center text-sm ${
                          metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.trend === 'up' ? (
                            <ArrowTrendingUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4" />
                          )}
                          <span className="ml-1">{Math.abs(metric.change)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {insight.chartData && (
                  <div className="mt-4 h-48">
                    {insight.chartData.type === 'line' ? (
                      <Line data={insight.chartData} options={chartOptions} />
                    ) : (
                      <Bar data={insight.chartData} options={chartOptions} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 