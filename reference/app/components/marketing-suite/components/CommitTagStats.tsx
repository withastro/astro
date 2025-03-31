'use client';

import { format, subDays, subMonths, subWeeks, subYears } from 'date-fns';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CommitTagStatsProps } from '../types/CommitTagTypes';

export default function CommitTagStats({
  taggedCommits,
  timeRange,
}: CommitTagStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let groupBy: (date: Date) => string;

    switch (timeRange) {
      case 'day':
        startDate = subDays(now, 1);
        dateFormat = 'HH:mm';
        groupBy = (date) => format(date, 'HH:mm');
        break;
      case 'week':
        startDate = subWeeks(now, 1);
        dateFormat = 'EEE';
        groupBy = (date) => format(date, 'EEE');
        break;
      case 'month':
        startDate = subMonths(now, 1);
        dateFormat = 'MMM d';
        groupBy = (date) => format(date, 'MMM d');
        break;
      case 'year':
        startDate = subYears(now, 1);
        dateFormat = 'MMM';
        groupBy = (date) => format(date, 'MMM');
        break;
    }

    // Filter commits within the time range and group by date
    const filteredCommits = taggedCommits.filter(
      commit => commit.date >= startDate
    );

    const groupedStats = filteredCommits.reduce((acc, commit) => {
      const dateKey = groupBy(commit.date);
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          total: 0,
          byCategory: {} as Record<string, number>,
          tags: new Set<string>(),
        };
      }

      acc[dateKey].total++;
      commit.tagDetails.forEach(tag => {
        acc[dateKey].tags.add(tag.name);
        if (!acc[dateKey].byCategory[tag.category]) {
          acc[dateKey].byCategory[tag.category] = 0;
        }
        acc[dateKey].byCategory[tag.category]++;
      });

      return acc;
    }, {} as Record<string, {
      date: string;
      total: number;
      byCategory: Record<string, number>;
      tags: Set<string>;
    }>);

    return Object.values(groupedStats);
  }, [taggedCommits, timeRange]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    taggedCommits.forEach(commit => {
      commit.tagDetails.forEach(tag => {
        uniqueCategories.add(tag.category);
      });
    });
    return Array.from(uniqueCategories);
  }, [taggedCommits]);

  const categoryColors = {
    release: '#3B82F6',
    feature: '#10B981',
    hotfix: '#EF4444',
    custom: '#8B5CF6',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Tag Activity</h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;

                return (
                  <div className="bg-white shadow-lg rounded-lg p-3 border">
                    <div className="font-medium text-gray-900 mb-1">{label}</div>
                    {payload.map((entry: { name: string; value: number }) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize">{entry.name}:</span>
                        <span className="ml-3 font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {categories.map((category, index) => (
              <Bar
                key={category}
                dataKey={`byCategory.${category}`}
                stackId="tags"
                fill={categoryColors[category as keyof typeof categoryColors]}
                name={category}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {categories.map(category => (
          <div
            key={category}
            className="flex items-center space-x-2 text-sm text-gray-600"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  categoryColors[category as keyof typeof categoryColors],
              }}
            />
            <span className="capitalize">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 