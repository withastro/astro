'use client';

import { ChartBarIcon, PlayCircleIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
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

interface VideoAd {
  id: string;
  title: string;
  format: 'in-stream' | 'discovery' | 'bumper';
  thumbnail: string;
  status: 'active' | 'paused' | 'ended';
  performance: {
    views: number;
    impressions: number;
    clicks: number;
    viewRate: number;
    cost: number;
  };
  targeting: {
    demographics: string[];
    interests: string[];
    placements: string[];
  };
}

export default function YouTubeAdsManager() {
  const [videoAds, setVideoAds] = useState<VideoAd[]>([
    {
      id: '1',
      title: 'Summer Product Launch',
      format: 'in-stream',
      thumbnail: '/thumbnails/summer-launch.jpg',
      status: 'active',
      performance: {
        views: 250000,
        impressions: 500000,
        clicks: 15000,
        viewRate: 50,
        cost: 2500,
      },
      targeting: {
        demographics: ['18-34', '35-54'],
        interests: ['Fashion', 'Shopping'],
        placements: ['YouTube Home', 'Related Videos'],
      },
    },
    // Add more video ads
  ]);

  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedFormat, setSelectedFormat] = useState('all');

  const performanceData = [
    {
      date: '2024-03-01',
      views: 25000,
      impressions: 50000,
      clicks: 1500,
    },
    // Add more data points
  ];

  const formatDistribution = [
    { name: 'In-stream', value: 60 },
    { name: 'Discovery', value: 25 },
    { name: 'Bumper', value: 15 },
  ];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>YouTube Ads Dashboard</CardTitle>
              <CardDescription>
                Manage and optimize your YouTube video advertising campaigns
              </CardDescription>
            </div>
            <Button>Create New Video Ad</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <Select
              value={selectedTimeRange}
              onValueChange={setSelectedTimeRange}
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
            <Select
              value={selectedFormat}
              onValueChange={setSelectedFormat}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ad format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="in-stream">In-stream</SelectItem>
                <SelectItem value="discovery">Discovery</SelectItem>
                <SelectItem value="bumper">Bumper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(videoAds[0]?.performance || {}).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    {key === 'views' && <PlayCircleIcon className="w-5 h-5 text-indigo-600" />}
                    {key === 'viewRate' && <ChartBarIcon className="w-5 h-5 text-green-600" />}
                    {key === 'cost' && <span className="text-red-600">$</span>}
                    <div>
                      <div className="text-2xl font-bold">
                        {typeof value === 'number' && key === 'cost'
                          ? `$${value.toLocaleString()}`
                          : key === 'viewRate'
                          ? `${value}%`
                          : value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>View Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stackId="1"
                        stroke="#4F46E5"
                        fill="#4F46E5"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ad Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {formatDistribution.map((entry, index) => (
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
        </CardContent>
      </Card>

      {/* Video Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Video Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoAds.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="pt-6">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 relative">
                    <VideoCameraIcon className="w-12 h-12 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">{ad.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 capitalize">{ad.format}</span>
                      <span className={`px-2 py-1 rounded-full text-sm
                        ${ad.status === 'active' ? 'bg-green-100 text-green-800' :
                          ad.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Views: {ad.performance.views.toLocaleString()}</div>
                      <div>View Rate: {ad.performance.viewRate}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 