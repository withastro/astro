'use client';

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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Campaign {
  id: string;
  name: string;
  budget: number;
  status: 'active' | 'paused' | 'ended';
  startDate: string;
  endDate?: string;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    revenue: number;
  };
}

interface AssetGroup {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text';
  performance: 'low' | 'good' | 'best';
  impressions: number;
}

export default function PMaxCampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Collection 2024',
      budget: 1000,
      status: 'active',
      startDate: '2024-03-01',
      performance: {
        impressions: 150000,
        clicks: 7500,
        conversions: 250,
        cost: 850,
        revenue: 12500,
      },
    },
    // Add more sample campaigns
  ]);

  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaigns[0]?.id);

  const performanceData = [
    { date: '2024-03-01', impressions: 15000, clicks: 750, conversions: 25 },
    { date: '2024-03-02', impressions: 16500, clicks: 825, conversions: 28 },
    // Add more performance data points
  ];

  const assetGroups: AssetGroup[] = [
    {
      id: '1',
      name: 'Summer Collection Images',
      type: 'image',
      performance: 'best',
      impressions: 75000,
    },
    {
      id: '2',
      name: 'Product Showcase Video',
      type: 'video',
      performance: 'good',
      impressions: 45000,
    },
    // Add more asset groups
  ];

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Max Campaigns</CardTitle>
              <CardDescription>
                Manage and optimize your Performance Max campaigns
              </CardDescription>
            </div>
            <Button>Create New Campaign</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Select
              value={selectedCampaign}
              onValueChange={setSelectedCampaign}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Object.entries(campaigns[0]?.performance || {}).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {typeof value === 'number' && key.includes('cost' || 'revenue')
                      ? `$${value.toLocaleString()}`
                      : value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="impressions"
                        stroke="#4F46E5"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
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
                <CardTitle>Asset Group Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetGroups}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="impressions" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Asset Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Groups</CardTitle>
          <CardDescription>
            Manage your campaign assets and monitor their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetGroups.map((group) => (
              <Card key={group.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{group.type}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-sm
                      ${group.performance === 'best' ? 'bg-green-100 text-green-800' :
                        group.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {group.performance}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {group.impressions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Impressions</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 