'use client';

import { motion } from 'framer-motion';

interface MarketingSuitePageTitleProps {
  title: string;
  description?: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

export const MarketingSuitePageTitle = ({
  title,
  description,
  actions,
}: MarketingSuitePageTitleProps) => {
  return (
    <div className="md:flex md:items-center md:justify-between mb-8">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-4 flex md:ml-4 md:mt-0">
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`${
                index > 0 ? 'ml-3' : ''
              } inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                action.variant === 'secondary'
                  ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}; 