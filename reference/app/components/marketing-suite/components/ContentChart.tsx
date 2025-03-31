'use client';

import {
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HistoricalDataPoint } from '../types/ContentPerformanceTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ContentChartProps {
  historicalData: HistoricalDataPoint[];
}

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

export default function ContentChart({ historicalData }: ContentChartProps) {
  const chartData: ChartData<'line'> = {
    labels: historicalData.map(d => d.date),
    datasets: [
      {
        label: 'Views',
        data: historicalData.map(d => d.views),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Engagement',
        data: historicalData.map(d => d.engagement),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
} 