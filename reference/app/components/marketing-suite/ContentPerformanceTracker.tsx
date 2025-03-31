'use client';

import { useState } from 'react';
import ContentChart from './components/ContentChart';
import ContentFilters from './components/ContentFilters';
import ContentMetrics from './components/ContentMetrics';
import { 
  ContentFilters,
  ContentItem,
  ContentPerformanceTrackerProps,
  defaultFilters 
} from './types/ContentPerformanceTypes';

export default function ContentPerformanceTracker({
  contentItems,
  onRefresh,
  onFilterChange,
}: ContentPerformanceTrackerProps) {
  const [filters, setFilters] = useState<ContentFilters>(defaultFilters);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const handleFilterChange = (newFilters: Partial<ContentFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const filteredAndSortedContent = contentItems
    .filter(item => filters.type === 'all' || item.type === filters.type)
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'views':
          return b.metrics.views - a.metrics.views;
        case 'engagement':
          return b.metrics.engagementRate - a.metrics.engagementRate;
        case 'date':
          return b.publishDate.getTime() - a.publishDate.getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Performance</h2>
        <ContentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={onRefresh}
        />
      </div>

      <div className="space-y-6">
        {filteredAndSortedContent.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setSelectedContent(
              selectedContent?.id === item.id ? null : item
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Published {item.publishDate.toLocaleDateString()}
                </p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                {item.type.toUpperCase()}
              </span>
            </div>

            <div className="mt-4">
              <ContentMetrics metrics={item.metrics} />
            </div>

            {selectedContent?.id === item.id && (
              <div className="mt-6">
                <ContentChart historicalData={item.historicalData} />
              </div>
            )}
          </div>
        ))}

        {filteredAndSortedContent.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No content found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
} 