import { Commit } from './CommitTypes';

export interface TagDetail {
  name: string;
  category: string;
  description?: string;
}

export interface TaggedCommit extends Commit {
  id: string;
  message: string;
  date: Date;
  tagDetails: TagDetail[];
}

export interface CommitTagTimelineProps {
  taggedCommits: TaggedCommit[];
  onTagClick?: (tag: string) => void;
  onCommitClick?: (commit: TaggedCommit) => void;
}

export interface CommitTagFlowProps {
  taggedCommits: TaggedCommit[];
  selectedTag?: string;
  onTagSelect?: (tag: string) => void;
}

export interface CommitTagBubbleProps {
  tag: TaggedCommit['tagDetails'][0];
  isSelected?: boolean;
  onClick?: () => void;
}

export interface CommitTagStatsProps {
  taggedCommits: TaggedCommit[];
  timeRange: 'day' | 'week' | 'month' | 'year';
}

export interface CommitTagFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  timeRange: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange: (range: 'day' | 'week' | 'month' | 'year') => void;
} 