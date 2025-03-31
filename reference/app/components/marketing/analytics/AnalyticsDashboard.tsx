'use client';

import {
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChannelPerformance {
  channel: string;
  sessions: number;
  conversions: number;
  revenue: number;
  cpa: number;
  roas: number;
}

interface CampaignPerformance {
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedChannel, setSelectedChannel] = useState('all');

  const overallMetrics = {
    totalRevenue: 125000,
    totalConversions: 2500,
    averageOrderValue: 50,
    roas: 3.5,
  };

  const channelData: ChannelPerformance[] = [
    {
      channel: 'Google Shopping',
      sessions: 50000,
      conversions: 1000,
      revenue: 50000,
      cpa: 25,
      roas: 4,
    },
    {
      channel: 'Performance Max',
      sessions: 30000,
      conversions: 800,
      revenue: 40000,
      cpa: 30,
      roas: 3.2,
    },
    {
      channel: 'YouTube Ads',
      sessions: 25000,
      conversions: 400,
      revenue: 20000,
      cpa: 35,
      roas: 2.8,
    },
    {
      channel: 'Influencer',
      sessions: 20000,
      conversions: 300,
      revenue: 15000,
      cpa: 40,
      roas: 2.5,
    },
  ];

  const revenueData = [
    { date: '2024-03-01', revenue: 15000, conversions: 300 },
    { date: '2024-03-02', revenue: 17500, conversions: 350 },
    { date: '2024-03-03', revenue: 16000, conversions: 320 },
    { date: '2024-03-04', revenue: 18500, conversions: 370 },
    { date: '2024-03-05', revenue: 19000, conversions: 380 },
    { date: '2024-03-06', revenue: 20000, conversions: 400 },
    { date: '2024-03-07', revenue: 19000, conversions: 380 },
  ];

  const channelDistribution = channelData.map(channel => ({
    name: channel.channel,
    value: channel.revenue,
  }));

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Marketing Analytics Dashboard</CardTitle>
              <CardDescription>
                Track and analyze your marketing performance across all channels
              </CardDescription>
            </div>
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      ${overallMetrics.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {overallMetrics.totalConversions.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Conversions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      ${overallMetrics.averageOrderValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Average Order Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {overallMetrics.roas.toFixed(1)}x
                    </div>
                    <div className="text-sm text-gray-500">ROAS</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Conversions Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4F46E5"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversions"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {channelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channel Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Channel</th>
                      <th className="text-right py-3 px-4">Sessions</th>
                      <th className="text-right py-3 px-4">Conversions</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                      <th className="text-right py-3 px-4">CPA</th>
                      <th className="text-right py-3 px-4">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((channel) => (
                      <tr key={channel.channel} className="border-b">
                        <td className="py-3 px-4">{channel.channel}</td>
                        <td className="text-right py-3 px-4">
                          {channel.sessions.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          {channel.conversions.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          ${channel.revenue.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          ${channel.cpa.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4">
                          {channel.roas.toFixed(1)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 