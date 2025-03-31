'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';

export default function WebDevelopmentPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params);

  const features = [
    {
      title: 'Custom Web Applications',
      description: 'Tailored solutions built with modern frameworks and technologies.',
      icon: '💻'
    },
    {
      title: 'Responsive Design',
      description: 'Beautiful interfaces that work seamlessly across all devices.',
      icon: '📱'
    },
    {
      title: 'Performance Optimization',
      description: 'Lightning-fast loading times and optimal user experience.',
      icon: '⚡'
    },
    {
      title: 'Scalable Architecture',
      description: 'Future-proof solutions that grow with your business.',
      icon: '🏗️'
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Web Development Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
          >
            Building powerful, scalable web applications with cutting-edge technology
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Project?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Let's discuss how we can help bring your web development project to life.
          </p>
          <Link 
            href={`/${locale}/contact`}
            className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Get Started
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </main>
  );
} 