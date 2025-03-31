'use client';

import { TagIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { CommitTagBubbleProps } from '../types/CommitTagTypes';

const categoryIcons = {
  release: '🚀',
  feature: '✨',
  hotfix: '🔧',
  custom: '🏷️',
};

export default function CommitTagBubble({
  tag,
  isSelected = false,
  onClick,
}: CommitTagBubbleProps) {
  const priorityScale = Math.min(Math.max(tag.priority, 1), 5);
  const bubbleSize = `${(priorityScale * 0.5) + 2}rem`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative transition-all duration-200 ease-in-out',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        isSelected ? 'scale-105' : ''
      )}
      style={{
        width: bubbleSize,
        height: bubbleSize,
      }}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-200',
          'flex items-center justify-center',
          isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
        )}
        style={{
          backgroundColor: tag.color,
          boxShadow: isSelected ? `0 0 0 3px ${tag.color}40` : 'none',
        }}
      >
        <span className="text-lg">{categoryIcons[tag.category]}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="font-medium">{tag.name}</div>
        <div className="text-gray-300 text-[10px]">
          by {tag.createdBy.name}
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-gray-900" />
      </div>
    </button>
  );
} 