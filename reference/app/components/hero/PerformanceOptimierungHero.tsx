'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Gauge } from 'lucide-react';

interface Slide {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  visualType: 'core-web-vitals' | 'code-optimization' | 'next-gen' | 'cdn' | 'monitoring';
  features: Array<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
  }>;
}

const slides: Slide[] = [
  {
    badge: 'Core Web Vitals',
    title: 'Performance Optimierung',
    subtitle: 'Schnellere Ladezeiten & bessere User Experience',
    description: 'Optimieren Sie Ihre Website für bessere Core Web Vitals und steigern Sie Ihre Google Rankings.',
    primaryCta: 'Jetzt optimieren',
    secondaryCta: 'Mehr erfahren',
    visualType: 'core-web-vitals',
    features: [
      {
        icon: <Gauge className="h-5 w-5 text-white" />,
        title: 'Performance Score',
        subtitle: 'Verbesserung um bis zu 300%'
      },
      {
        icon: <Code className="h-5 w-5 text-white" />,
        title: 'Code Optimierung',
        subtitle: 'Reduzierte Ladezeiten'
      }
    ]
  }
];

export default function PerformanceOptimierungHero() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const currentSlideData = slides[currentSlide];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white min-h-[700px]">
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-20 sm:py-32">
          <div className="grid grid-cols-1 gap-x-16 gap-y-20 lg:grid-cols-2">
            {/* Content */}
            <div className="self-center">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="mb-4 flex">
                  <Badge className="px-3 py-1 bg-white/20 border-white/30 text-white backdrop-blur-sm">
                    {currentSlideData.badge}
                  </Badge>
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                    {currentSlideData.title.split(' ')[0]}
                  </span>
                  <span> {currentSlideData.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                
                <h2 className="text-2xl font-medium text-gray-200 mt-2 mb-4">
                  {currentSlideData.subtitle}
                </h2>
                
                <p className="mt-4 text-lg leading-8 text-gray-300">
                  {currentSlideData.description}
                </p>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {currentSlideData.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                        {feature.icon}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-white">{feature.title}</p>
                        <p className="text-xs text-gray-400">{feature.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900">
                    {currentSlideData.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                    {currentSlideData.secondaryCta}
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Visualization */}
            <motion.div
              key={`visual-${currentSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative lg:self-center"
            >
              <div className="relative bg-white/10 backdrop-blur-xl p-6 lg:p-8 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {currentSlideData.visualType === 'core-web-vitals' && (
                  <div className="h-80 flex flex-col items-center justify-center">
                    <div className="relative w-40 h-40 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-teal-400 border-l-transparent border-r-transparent border-b-transparent"
                        style={{ transform: 'rotate(45deg)' }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <Gauge className="h-10 w-10 text-teal-300 mb-1" />
                        <div className="text-2xl font-bold">97/100</div>
                        <div className="text-xs text-white/70">Performance</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 w-full">
                      {['LCP', 'CLS', 'FID'].map((metric, i) => (
                        <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                          <div className="text-xs text-white/70 mb-1">{metric}</div>
                          <div className="text-lg font-bold">
                            {i === 0 ? '1.1s' : i === 1 ? '0.02' : '8ms'}
                          </div>
                          <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
                            <div className="bg-teal-400 h-full rounded-full" style={{width: `${95 - i * 5}%`}}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
        aria-label="Previous slide"
      >
        <ArrowRight className="h-5 w-5 rotate-180" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
        aria-label="Next slide"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
} 