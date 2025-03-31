import React from 'react';
import { Card } from '../ui/card';

interface LineChartProps {
  data: {
    label: string;
    value: number;
  }[];
  title: string;
}

export function LineChart({ data, title }: LineChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value / maxValue) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="rgb(79, 70, 229)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute inset-0 grid grid-cols-1">
          {data.map((item, index) => (
            <div key={index} className="relative h-full">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 