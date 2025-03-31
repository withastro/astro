import React from 'react';
import { Card } from '../ui/card';

interface BarChartProps {
  data: {
    label: string;
    value: number;
  }[];
  title: string;
}

export function BarChart({ data, title }: BarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          // Calculate the width percentage
          const widthPercentage = (item.value / maxValue) * 100;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900 font-medium">{item.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-indigo-600 rounded-full w-[${widthPercentage}%]`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
} 