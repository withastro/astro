'use client';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { DocumentIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CommitFileDiffProps } from '../types/CommitTypes';

const statusColors = {
  added: 'text-green-600',
  modified: 'text-yellow-600',
  deleted: 'text-red-600',
};

const statusIcons = {
  added: PlusIcon,
  modified: DocumentIcon,
  deleted: MinusIcon,
};

export default function CommitFileDiff({
  file,
  expanded: defaultExpanded = false,
  onToggleExpand,
}: CommitFileDiffProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const Icon = statusIcons[file.status];

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggleExpand?.();
  };

  const renderDiff = () => {
    if (!file.diff) return null;

    return (
      <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
        {file.diff.split('\n').map((line, index) => {
          let lineClass = 'block';
          if (line.startsWith('+')) lineClass = 'block bg-green-50 text-green-700';
          if (line.startsWith('-')) lineClass = 'block bg-red-50 text-red-700';

          return (
            <code key={index} className={lineClass}>
              {line}
            </code>
          );
        })}
      </pre>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <div className="flex items-center space-x-3">
          <Icon className={cn('w-5 h-5', statusColors[file.status])} />
          <span className="text-sm font-medium text-gray-900">{file.path}</span>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="text-green-600">+{file.additions}</span>
            <span className="text-red-600">-{file.deletions}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && file.diff && (
        <div className="border-t">{renderDiff()}</div>
      )}
    </div>
  );
} 