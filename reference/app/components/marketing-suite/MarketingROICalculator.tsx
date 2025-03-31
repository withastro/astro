'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface MarketingChannel {
  id: string;
  name: string;
  spend: number;
  revenue: number;
  color: string;
}

interface MarketingROICalculatorProps {
  channels: MarketingChannel[];
  period: 'monthly' | 'quarterly' | 'yearly';
  onUpdateChannel: (channelId: string, updates: Partial<MarketingChannel>) => void;
}

export const MarketingROICalculator = ({
  channels,
  period,
  onUpdateChannel,
}: MarketingROICalculatorProps) => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const calculateROI = (spend: number, revenue: number) => {
    return ((revenue - spend) / spend * 100).toFixed(2);
  };

  const calculateTotalROI = () => {
    const totalSpend = channels.reduce((sum, channel) => sum + channel.spend, 0);
    const totalRevenue = channels.reduce((sum, channel) => sum + channel.revenue, 0);
    return calculateROI(totalSpend, totalRevenue);
  };

  const pieData = channels.map((channel) => ({
    name: channel.name,
    value: channel.revenue - channel.spend,
    color: channel.color,
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Marketing ROI Calculator</h2>
          <p className="text-gray-500 capitalize">{period} Performance Analysis</p>
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {calculateTotalROI()}% ROI
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedChannel === channel.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              onClick={() => setSelectedChannel(channel.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">{channel.name}</h3>
                <span
                  className={`text-sm font-medium ${
                    Number(calculateROI(channel.spend, channel.revenue)) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {calculateROI(channel.spend, channel.revenue)}% ROI
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Spend</label>
                  <input
                    type="number"
                    value={channel.spend}
                    onChange={(e) =>
                      onUpdateChannel(channel.id, { spend: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Revenue</label>
                  <input
                    type="number"
                    value={channel.revenue}
                    onChange={(e) =>
                      onUpdateChannel(channel.id, { revenue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          ((channel.revenue - channel.spend) /
                            Math.max(...channels.map((c) => c.revenue - c.spend))) * 100,
                          0
                        ),
                        100
                      )}%`,
                      backgroundColor: channel.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Spend</div>
            <div className="text-2xl font-bold text-gray-800">
              ${channels.reduce((sum, channel) => sum + channel.spend, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-800">
              ${channels.reduce((sum, channel) => sum + channel.revenue, 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Net Profit</div>
            <div className="text-2xl font-bold text-gray-800">
              ${(
                channels.reduce((sum, channel) => sum + channel.revenue, 0) -
                channels.reduce((sum, channel) => sum + channel.spend, 0)
              ).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 