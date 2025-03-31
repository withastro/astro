'use client';

import { CheckCircleIcon, ClockIcon, QuestionMarkCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { CommitStatusBadgeProps } from '../types/CommitTypes';

const statusConfig = {
  approved: {
    icon: CheckCircleIcon,
    text: 'Approved',
    className: 'bg-green-100 text-green-800',
  },
  rejected: {
    icon: XCircleIcon,
    text: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
  pending: {
    icon: ClockIcon,
    text: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
  },
  'needs-review': {
    icon: QuestionMarkCircleIcon,
    text: 'Needs Review',
    className: 'bg-blue-100 text-blue-800',
  },
} as const;

export default function CommitStatusBadge({ status, className }: CommitStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="w-4 h-4 mr-1" aria-hidden="true" />
      {config.text}
    </span>
  );
} 