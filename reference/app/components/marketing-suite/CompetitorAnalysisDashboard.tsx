'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';

interface Competitor {
  id: string;
  name: string;
  metrics: {
    seoScore: number;
    socialPresence: number;
    contentQuality: number;
    brandAwareness: number;
    marketShare: number;
    customerSatisfaction: number;
  };
  color: string;
}

interface CompetitorAnalysisDashboardProps {
  competitors: Competitor[];
  ourMetrics: Competitor['metrics'];
  onTrackCompetitor: (competitorId: string) => void;
}

export const CompetitorAnalysisDashboard = ({
  competitors,
  ourMetrics,
  onTrackCompetitor,
}: CompetitorAnalysisDashboardProps) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'seoScore',
    'socialPresence',
    'contentQuality',
  ]);

  const metricLabels = {
    seoScore: 'SEO Score',
    socialPresence: 'Social Presence',
    contentQuality: 'Content Quality',
    brandAwareness: 'Brand Awareness',
    marketShare: 'Market Share',
    customerSatisfaction: 'Customer Satisfaction',
  };

  const radarData = Object.keys(metricLabels).map((metric) => ({
    metric: metricLabels[metric as keyof typeof metricLabels],
    us: ourMetrics[metric as keyof typeof ourMetrics],
    ...competitors.reduce(
      (acc, competitor) => ({
        ...acc,
        [competitor.name]: competitor.metrics[metric as keyof typeof ourMetrics],
      }),
      {}
    ),
  }));

  const calculateOverallScore = (metrics: Competitor['metrics']) => {
    return (
      Object.values(metrics).reduce((sum, value) => sum + value, 0) /
      Object.values(metrics).length
    ).toFixed(1);
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Competitor Analysis</h2>
          <p className="text-gray-500">Compare key metrics with competitors</p>
        </div>
        <div className="flex space-x-2">
          {Object.entries(metricLabels).map(([key, label]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMetric(key)}
              className={`px-3 py-1 text-sm rounded-lg ${
                selectedMetrics.includes(key)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Our Company"
                dataKey="us"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.3}
              />
              {competitors.map((competitor) => (
                <Radar
                  key={competitor.id}
                  name={competitor.name}
                  dataKey={competitor.name}
                  stroke={competitor.color}
                  fill={competitor.color}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">Our Company</h3>
              <span className="text-blue-600 font-medium">
                {calculateOverallScore(ourMetrics)}
              </span>
            </div>
            <div className="space-y-2">
              {selectedMetrics.map((metric) => (
                <div key={metric}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{metricLabels[metric as keyof typeof metricLabels]}</span>
                    <span>{ourMetrics[metric as keyof typeof ourMetrics]}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{
                        width: `${ourMetrics[metric as keyof typeof ourMetrics]}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">{competitor.name}</h3>
                <span
                  className="font-medium"
                  style={{ color: competitor.color }}
                >
                  {calculateOverallScore(competitor.metrics)}
                </span>
              </div>
              <div className="space-y-2">
                {selectedMetrics.map((metric) => (
                  <div key={metric}>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{metricLabels[metric as keyof typeof metricLabels]}</span>
                      <span>
                        {competitor.metrics[metric as keyof typeof ourMetrics]}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="rounded-full h-2"
                        style={{
                          width: `${
                            competitor.metrics[metric as keyof typeof ourMetrics]
                          }%`,
                          backgroundColor: competitor.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTrackCompetitor(competitor.id)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
              >
                Track Changes
              </motion.button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 