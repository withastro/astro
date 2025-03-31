'use client';

import { 
  ChatBubbleLeftIcon, 
  HashtagIcon, 
  HeartIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
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

interface Influencer {
  id: string;
  name: string;
  avatar: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  followers: number;
  engagement: number;
  categories: string[];
  performance: {
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
  campaigns: {
    active: number;
    completed: number;
    upcoming: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'upcoming';
  influencers: number;
  budget: number;
  metrics: {
    reach: number;
    engagement: number;
    conversions: number;
  };
}

export default function InfluencerDashboard() {
  const [influencers, setInfluencers] = useState<Influencer[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
      platform: 'instagram',
      followers: 500000,
      engagement: 4.5,
      categories: ['Fashion', 'Lifestyle'],
      performance: {
        reach: 750000,
        impressions: 1000000,
        engagement: 45000,
        clicks: 25000,
        conversions: 1200,
      },
      campaigns: {
        active: 2,
        completed: 5,
        upcoming: 1,
      },
    },
    // Add more influencers
  ]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Collection Launch',
      status: 'active',
      influencers: 5,
      budget: 25000,
      metrics: {
        reach: 1500000,
        engagement: 75000,
        conversions: 2500,
      },
    },
    // Add more campaigns
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const performanceData = [
    {
      date: '2024-03-01',
      reach: 150000,
      engagement: 7500,
      conversions: 250,
    },
    // Add more performance data
  ];

  const influencerMetrics = [
    { subject: 'Reach', A: 120, fullMark: 150 },
    { subject: 'Engagement', A: 98, fullMark: 150 },
    { subject: 'Brand Fit', A: 86, fullMark: 150 },
    { subject: 'Content Quality', A: 99, fullMark: 150 },
    { subject: 'Audience Match', A: 85, fullMark: 150 },
    { subject: 'ROI', A: 65, fullMark: 150 },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Influencer Marketing Dashboard</CardTitle>
              <CardDescription>
                Monitor and manage your influencer marketing campaigns
              </CardDescription>
            </div>
            <Button>Add New Influencer</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <Input
              placeholder="Search influencers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select
              value={selectedPlatform}
              onValueChange={setSelectedPlatform}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(influencers[0]?.performance || {}).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    {key === 'reach' && <UserGroupIcon className="w-5 h-5 text-indigo-600" />}
                    {key === 'engagement' && <HeartIcon className="w-5 h-5 text-pink-600" />}
                    {key === 'conversions' && <HashtagIcon className="w-5 h-5 text-green-600" />}
                    <div>
                      <div className="text-2xl font-bold">
                        {value.toLocaleString()}
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
                <CardTitle>Campaign Performance</CardTitle>
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
                        dataKey="reach"
                        stroke="#4F46E5"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#EC4899"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Influencer Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={influencerMetrics}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#4F46E5"
                        fill="#4F46E5"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <Badge
                        className={
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Influencers</div>
                        <div className="font-medium">{campaign.influencers}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Budget</div>
                        <div className="font-medium">${campaign.budget.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Reach</div>
                        <div className="font-medium">{campaign.metrics.reach.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Conversions</div>
                        <div className="font-medium">{campaign.metrics.conversions.toLocaleString()}</div>
                      </div>
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