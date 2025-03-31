'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export default function AIContentPage() {
  const features = [
    {
      title: 'AI-Powered Content Generation',
      description: 'Create high-quality, engaging content at scale using state-of-the-art AI models.',
      benefits: [
        'Blog posts and articles',
        'Social media content',
        'Product descriptions',
        'Marketing copy'
      ]
    },
    {
      title: 'SEO Optimization',
      description: 'Optimize your content for search engines while maintaining natural readability.',
      benefits: [
        'Keyword research and integration',
        'Meta description generation',
        'Content structure optimization',
        'Readability analysis'
      ]
    },
    {
      title: 'Multilingual Content',
      description: 'Reach global audiences with AI-powered translation and localization.',
      benefits: [
        'Neural machine translation',
        'Cultural adaptation',
        'Tone preservation',
        'Multiple language support'
      ]
    },
    {
      title: 'Content Analytics',
      description: 'Track and analyze your content performance with advanced analytics.',
      benefits: [
        'Engagement metrics',
        'Performance tracking',
        'A/B testing',
        'ROI analysis'
      ]
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl font-bold mb-6">AI Content Creation</h1>
            <p className="text-xl mb-8">
              Transform your content strategy with AI-powered solutions that deliver
              engaging, optimized, and scalable content for your business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start">
                      <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Content?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get started with our AI-powered content creation solutions and take your
            content strategy to the next level.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-indigo-600 text-white rounded-full text-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Creating Content
          </motion.button>
        </div>
      </section>
    </main>
  );
} 