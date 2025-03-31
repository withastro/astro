'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { 
  ChartBarIcon, 
  EnvelopeIcon, 
  GlobeAltIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { useState } from 'react';

interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  engagement: number;
}

interface MarketingCampaignCardProps {
  id: string;
  title: string;
  description: string;
  type: 'email' | 'social' | 'web';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate: Date;
  metrics: CampaignMetrics;
  budget?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  paused: 'bg-yellow-100 text-yellow-800',
};

const typeIcons = {
  email: EnvelopeIcon,
  social: UserGroupIcon,
  web: GlobeAltIcon,
};

export default function MarketingCampaignCard({
  id,
  title,
  description,
  type,
  status,
  startDate,
  endDate,
  metrics,
  budget,
  onEdit,
  onDelete,
}: MarketingCampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TypeIcon = typeIcons[type];

  const formatMetric = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const handleEdit = () => {
    if (onEdit) onEdit(id);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this campaign?')) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <TypeIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">{description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Impressions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatMetric(metrics.impressions)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Clicks</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatMetric(metrics.clicks)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Conversions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatMetric(metrics.conversions)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Engagement</div>
                <div className="text-lg font-semibold text-gray-900">
                  {metrics.engagement}%
                </div>
              </div>
            </div>

            {budget && (
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Budget: ${budget.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 