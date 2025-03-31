import { ChartData } from 'chart.js';

export interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'video' | 'infographic' | 'social' | 'ebook';
  publishDate: Date;
  metrics: ContentMetrics;
  historicalData: HistoricalDataPoint[];
}

export interface ContentMetrics {
  views: number;
  engagementRate: number;
  shares: number;
  averageTimeOnPage: number;
  conversionRate: number;
}

export interface HistoricalDataPoint {
  date: string;
  views: number;
  engagement: number;
}

export interface ContentFilters {
  type: string;
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  sortBy: 'views' | 'engagement' | 'date';
}

export interface ContentPerformanceTrackerProps {
  contentItems: ContentItem[];
  onRefresh?: () => void;
  onFilterChange?: (filters: ContentFilters) => void;
}

export const defaultFilters: ContentFilters = {
  type: 'all',
  dateRange: 'month',
  sortBy: 'views',
}; 