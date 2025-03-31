'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TestVariant {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
  revenue: number;
}

interface ABTestingDashboardProps {
  testName: string;
  startDate: string;
  endDate: string;
  variants: TestVariant[];
  onEndTest: (winnerId: string) => void;
}

export const ABTestingDashboard = ({
  testName,
  startDate,
  endDate,
  variants,
  onEndTest,
}: ABTestingDashboardProps) => {
  const [selectedMetric, setSelectedMetric] = useState<'conversions' | 'revenue'>('conversions');

  const calculateConversionRate = (variant: TestVariant) => {
    return ((variant.conversions / variant.visitors) * 100).toFixed(2);
  };

  const calculateRevenuePerVisitor = (variant: TestVariant) => {
    return (variant.revenue / variant.visitors).toFixed(2);
  };

  const calculateConfidenceLevel = (variantA: TestVariant, variantB: TestVariant) => {
    // Simplified statistical significance calculation
    const convRateA = variantA.conversions / variantA.visitors;
    const convRateB = variantB.conversions / variantB.visitors;
    const pooledStdErr = Math.sqrt(
      (convRateA * (1 - convRateA)) / variantA.visitors +
      (convRateB * (1 - convRateB)) / variantB.visitors
    );
    const zScore = Math.abs(convRateA - convRateB) / pooledStdErr;
    return Math.min(((1 - 0.5 * Math.exp(-0.7 * zScore)) * 100), 99.9).toFixed(1);
  };

  const getWinningVariant = () => {
    return variants.reduce((prev, current) => {
      const prevMetric = selectedMetric === 'conversions' 
        ? Number(calculateConversionRate(prev))
        : Number(calculateRevenuePerVisitor(prev));
      const currentMetric = selectedMetric === 'conversions'
        ? Number(calculateConversionRate(current))
        : Number(calculateRevenuePerVisitor(current));
      return prevMetric > currentMetric ? prev : current;
    });
  };

  const winner = getWinningVariant();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{testName}</h2>
          <p className="text-gray-500">
            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          {['conversions', 'revenue'].map((metric) => (
            <motion.button
              key={metric}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMetric(metric as 'conversions' | 'revenue')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedMetric === metric
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)} Rate
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className={`p-6 rounded-lg border-2 ${
              variant.id === winner.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {variant.name}
                {variant.id === winner.id && (
                  <span className="ml-2 text-green-600 text-sm">(Winner)</span>
                )}
              </h3>
              <span className="text-sm text-gray-500">
                {variant.visitors.toLocaleString()} visitors
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Conversion Rate</span>
                  <span>{calculateConversionRate(variant)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${calculateConversionRate(variant)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Revenue per Visitor</span>
                  <span>${calculateRevenuePerVisitor(variant)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 rounded-full h-2"
                    style={{
                      width: `${(variant.revenue / (variants.reduce((max, v) => Math.max(max, v.revenue), 0))) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={variants}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey={selectedMetric === 'conversions' ? 'conversions' : 'revenue'}
              fill="#3B82F6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Statistical Confidence:{' '}
          <span className="font-semibold">
            {calculateConfidenceLevel(variants[0], variants[1])}%
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEndTest(winner.id)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
        >
          End Test & Implement Winner
        </motion.button>
      </div>
    </div>
  );
}; 