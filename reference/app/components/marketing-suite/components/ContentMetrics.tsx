'use client';

import {
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  HandThumbUpIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { ContentMetrics as ContentMetricsType } from '../types/ContentPerformanceTypes';

interface ContentMetricsProps {
  metrics: ContentMetricsType;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export default function ContentMetrics({ metrics }: ContentMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="flex items-center space-x-2">
        <EyeIcon className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-sm text-gray-500">Views</div>
          <div className="font-semibold">{metrics.views.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <HandThumbUpIcon className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-sm text-gray-500">Engagement</div>
          <div className="font-semibold">{metrics.engagementRate}%</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <ShareIcon className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-sm text-gray-500">Shares</div>
          <div className="font-semibold">{metrics.shares}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <ClockIcon className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-sm text-gray-500">Avg. Time</div>
          <div className="font-semibold">
            {formatDuration(metrics.averageTimeOnPage)}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-sm text-gray-500">Conversion</div>
          <div className="font-semibold">{metrics.conversionRate}%</div>
        </div>
      </div>
    </div>
  );
} 