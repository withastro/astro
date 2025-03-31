'use client';

import { useProgressBar } from '@react-aria/progress';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface SEOMetrics {
  titleLength: number;
  descriptionLength: number;
  keywordDensity: number;
  readabilityScore: number;
  hasMetaDescription: boolean;
  hasFocusKeyword: boolean;
  hasAltTags: boolean;
  urlOptimized: boolean;
}

interface SEOAnalyzerProps {
  url: string;
  onAnalyze: (metrics: SEOMetrics) => void;
}

interface ProgressBarProps {
  progress: number;
  label: string;
  testId: string;
}

// Custom component using React Aria for proper accessibility
const ProgressBar = ({ progress, label, testId }: ProgressBarProps) => {
  const { progressBarProps } = useProgressBar({
    label,
    value: progress,
    minValue: 0,
    maxValue: 100,
  });

  return (
    <div 
      {...progressBarProps} 
      className="w-full bg-gray-200 rounded-full h-2"
      data-testid={testId}
      data-actual-progress={progress}
    >
      <div 
        className={`bg-blue-600 rounded-full h-2 transition-all duration-500 w-[${progress}%]`}
      />
    </div>
  );
};

const scoreRanges = {
  poor: 'bg-red-100 text-red-800',
  fair: 'bg-yellow-100 text-yellow-800',
  good: 'bg-green-100 text-green-800',
};

export const SEOAnalyzer: React.FC<SEOAnalyzerProps> = ({ url: initialUrl = '', onAnalyze }) => {
  const [url] = useState(initialUrl);
  const [analyzing, setAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [overallScore, setOverallScore] = useState(0);

  const calculateScore = (metrics: SEOMetrics) => {
    let score = 0;
    if (metrics.titleLength >= 30 && metrics.titleLength <= 60) score += 20;
    if (metrics.descriptionLength >= 120 && metrics.descriptionLength <= 160) score += 20;
    if (metrics.keywordDensity >= 1 && metrics.keywordDensity <= 3) score += 15;
    if (metrics.readabilityScore >= 60) score += 15;
    if (metrics.hasMetaDescription) score += 10;
    if (metrics.hasFocusKeyword) score += 10;
    if (metrics.hasAltTags) score += 5;
    if (metrics.urlOptimized) score += 5;
    return score;
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return scoreRanges.good;
    if (score >= 60) return scoreRanges.fair;
    return scoreRanges.poor;
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Simulated analysis - in real implementation, this would make API calls
    const mockMetrics: SEOMetrics = {
      titleLength: 45,
      descriptionLength: 140,
      keywordDensity: 2.1,
      readabilityScore: 75,
      hasMetaDescription: true,
      hasFocusKeyword: true,
      hasAltTags: true,
      urlOptimized: true,
    };

    setTimeout(() => {
      setMetrics(mockMetrics);
      const score = calculateScore(mockMetrics);
      setOverallScore(score);
      onAnalyze(mockMetrics);
      setAnalyzing(false);
    }, 1500);
  };

  // Calculate title progress value
  const getTitleProgress = () => {
    if (!metrics) return 0;
    return Math.min((metrics.titleLength / 60) * 100, 100);
  };
  
  // Calculate description progress value
  const getDescriptionProgress = () => {
    if (!metrics) return 0;
    return Math.min((metrics.descriptionLength / 160) * 100, 100);
  };
  
  // Calculate keyword density progress value
  const getKeywordProgress = () => {
    if (!metrics) return 0;
    return Math.min((metrics.keywordDensity / 3) * 100, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Core SEO Analyzer</h2>
          <p className="text-gray-500">Analyze and optimize your page's SEO performance</p>
        </div>
        {metrics && (
          <div className={`px-4 py-2 rounded-lg font-medium ${getScoreClass(overallScore)}`}>
            Score: {overallScore}/100
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <label htmlFor="url-input">URL to analyze</label>
          <input
            id="url-input"
            type="text"
            value={url}
            readOnly
            placeholder="Enter URL to analyze"
            aria-label="URL to analyze"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium ${
              analyzing ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </motion.button>
        </div>

        {metrics && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Content Analysis</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Title Length</span>
                    <span className={getScoreClass(metrics.titleLength >= 30 && metrics.titleLength <= 60 ? 100 : 50)}>
                      {metrics.titleLength} characters
                    </span>
                  </div>
                  {/* Using custom ProgressBar component to handle ARIA attributes properly */}
                  <ProgressBar 
                    progress={getTitleProgress()}
                    label="Title length progress"
                    testId="title-progress"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Meta Description</span>
                    <span className={getScoreClass(metrics.descriptionLength >= 120 && metrics.descriptionLength <= 160 ? 100 : 50)}>
                      {metrics.descriptionLength} characters
                    </span>
                  </div>
                  <ProgressBar 
                    progress={getDescriptionProgress()}
                    label="Meta description length progress"
                    testId="desc-progress"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Keyword Density</span>
                    <span className={getScoreClass(metrics.keywordDensity >= 1 && metrics.keywordDensity <= 3 ? 100 : 50)}>
                      {metrics.keywordDensity.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar 
                    progress={getKeywordProgress()}
                    label="Keyword density progress"
                    testId="keyword-progress"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Technical Analysis</h3>
              <div className="space-y-3">
                {[
                  { label: 'Meta Description', value: metrics.hasMetaDescription },
                  { label: 'Focus Keyword', value: metrics.hasFocusKeyword },
                  { label: 'Image Alt Tags', value: metrics.hasAltTags },
                  { label: 'URL Optimization', value: metrics.urlOptimized },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-gray-600">{item.label}</span>
                    <span className={item.value ? scoreRanges.good : scoreRanges.poor}>
                      {item.value ? '✓ Optimized' : '× Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 