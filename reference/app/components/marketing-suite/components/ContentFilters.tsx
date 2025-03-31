'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ContentFilters } from '../types/ContentPerformanceTypes';

interface ContentFiltersProps {
  filters: ContentFilters;
  onFilterChange: (newFilters: Partial<ContentFilters>) => void;
  onRefresh?: () => void;
}

export default function ContentFilters({
  filters,
  onFilterChange,
  onRefresh,
}: ContentFiltersProps) {
  return (
    <div className="flex items-center space-x-4">
      <select
        value={filters.type}
        onChange={(e) => onFilterChange({ type: e.target.value })}
        className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">All Content Types</option>
        <option value="blog">Blog Posts</option>
        <option value="video">Videos</option>
        <option value="infographic">Infographics</option>
        <option value="social">Social Posts</option>
        <option value="ebook">eBooks</option>
      </select>

      <select
        value={filters.dateRange}
        onChange={(e) => onFilterChange({ dateRange: e.target.value as ContentFilters['dateRange'] })}
        className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="week">Last Week</option>
        <option value="month">Last Month</option>
        <option value="quarter">Last Quarter</option>
        <option value="year">Last Year</option>
      </select>

      <select
        value={filters.sortBy}
        onChange={(e) => onFilterChange({ sortBy: e.target.value as ContentFilters['sortBy'] })}
        className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="views">Sort by Views</option>
        <option value="engagement">Sort by Engagement</option>
        <option value="date">Sort by Date</option>
      </select>

      <button
        onClick={() => onRefresh?.()}
        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        aria-label="Refresh data"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </button>
    </div>
  );
} 