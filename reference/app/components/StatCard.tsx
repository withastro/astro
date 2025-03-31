import React from 'react';
import { Card } from './ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, description, trend }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}
        {trend && (
          <div className={`mt-2 flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span className="ml-1">{trend.value}%</span>
          </div>
        )}
      </div>
    </Card>
  );
} 