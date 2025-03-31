'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Code, Database, Lock, BarChart3, GlobeIcon, BookOpen, CreditCard, Users, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Define slide data
const slides = [
  {
    id: 'core-platform',
    badge: 'Enterprise Marketing Technology',
    title: 'CORE Platform',
    subtitle: 'Maßgeschneiderte Marketing-Technologie für messbare Resultate',
    description: 'Unsere proprietäre CORE-Plattform verbindet technisches Know-how mit strategischem Marketing für eine vollständig automatisierte, datengetriebene und DSGVO-konforme Marketinglösung, die Ihr ROI messbar steigert.',
    features: [
      { icon: <Database className="h-5 w-5 text-blue-300" />, title: 'API Integration', subtitle: 'Nahtlose Verbindung zu allen Systemen' },
      { icon: <Lock className="h-5 w-5 text-blue-300" />, title: 'DSGVO-konform', subtitle: '100% Made in Germany' },
      { icon: <Code className="h-5 w-5 text-blue-300" />, title: 'Custom Development', subtitle: 'Individuelle Software-Lösungen' },
      { icon: <BarChart3 className="h-5 w-5 text-blue-300" />, title: 'Präzises Tracking', subtitle: 'Lückenlose Performance-Analyse' }
    ],
    primaryCta: {
      text: 'Demo anfordern',
      href: '/contact/demo'
    },
    secondaryCta: {
      text: 'Kostenlose Beratung',
      href: '/contact'
    },
    stats: [
      { value: '78%', label: 'Automatisierungsgrad' },
      { value: '39%', label: 'Höhere Effizienz' },
      { value: '47%', label: 'ROI-Steigerung' }
    ],
    visualType: 'dashboard',
    color: 'blue',
  },
  {
    id: 'seo-services',
    badge: 'Suchmaschinenoptimierung',
    title: 'SEO Agentur',
    subtitle: 'Nachhaltige Rankings & organisches Wachstum',
    description: 'Unsere datengesteuerten SEO-Strategien kombinieren technische Expertise mit strategischer Content-Optimierung für nachweisbare Ranking-Verbesserungen und messbaren Traffic-Zuwachs.',
    features: [
      { icon: <GlobeIcon className="h-5 w-5 text-green-300" />, title: 'Technisches SEO', subtitle: 'Performance-optimierte Websites' },
      { icon: <BookOpen className="h-5 w-5 text-green-300" />, title: 'Content-Strategie', subtitle: 'Keyword-optimierte Inhalte' },
      { icon: <Users className="h-5 w-5 text-green-300" />, title: 'Local SEO', subtitle: 'Regionale Sichtbarkeit steigern' },
      { icon: <BarChart3 className="h-5 w-5 text-green-300" />, title: 'SEO-Tracking', subtitle: 'Transparente Erfolgsmessung' }
    ],
    primaryCta: {
      text: 'SEO-Audit anfordern',
      href: '/contact/seo-audit'
    },
    secondaryCta: {
      text: 'Mehr zu SEO-Services',
      href: '/seo'
    },
    stats: [
      { value: '47%', label: 'Mehr Traffic' },
      { value: '+12', label: 'Rankingpositionen' },
      { value: '63%', label: 'Conversion-Plus' }
    ],
    visualType: 'graph',
    color: 'green',
  },
  {
    id: 'google-ads',
    badge: 'Performance Marketing',
    title: 'Google Ads',
    subtitle: 'Performance-orientierte Kampagnen mit messbaren Ergebnissen',
    description: 'Maximieren Sie Ihren ROI mit unseren datengesteuerten Google Ads Kampagnen. Wir optimieren kontinuierlich für höhere Conversion-Raten bei gleichzeitiger Kostensenkung.',
    features: [
      { icon: <CreditCard className="h-5 w-5 text-orange-300" />, title: 'Performance Max', subtitle: 'KI-gesteuerte Kampagnen' },
      { icon: <Users className="h-5 w-5 text-orange-300" />, title: 'Zielgruppensegmentierung', subtitle: 'Präzise Ansprache' },
      { icon: <BarChart3 className="h-5 w-5 text-orange-300" />, title: 'Conversion-Tracking', subtitle: 'Lückenlose Attribution' },
      { icon: <Database className="h-5 w-5 text-orange-300" />, title: 'Datenanalyse', subtitle: 'Kontinuierliche Optimierung' }
    ],
    primaryCta: {
      text: 'Kampagnen-Check anfordern',
      href: '/contact/google-analyse'
    },
    secondaryCta: {
      text: 'Google Ads Leistungen',
      href: '/services/google-werbung'
    },
    stats: [
      { value: '32%', label: 'Niedrigere CPA' },
      { value: '22%', label: 'Höhere CTR' },
      { value: '42%', label: 'ROAS-Steigerung' }
    ],
    visualType: 'chart',
    color: 'orange',
  },
  {
    id: 'content-marketing',
    badge: 'Content Excellence',
    title: 'Content Marketing',
    subtitle: 'Strategische Inhalte für maximale Wirkung',
    description: 'Unser Content Marketing verbindet datengestützte Analysen mit kreativer Exzellenz für Inhalte, die nicht nur informieren, sondern auch konvertieren und nachhaltig Mehrwert bieten.',
    features: [
      { icon: <BookOpen className="h-5 w-5 text-purple-300" />, title: 'SEO-Content', subtitle: 'Keyword-optimierte Texte' },
      { icon: <Users className="h-5 w-5 text-purple-300" />, title: 'Storytelling', subtitle: 'Emotionale Markenbotschaften' },
      { icon: <BarChart3 className="h-5 w-5 text-purple-300" />, title: 'Content-Performance', subtitle: 'Datenbasierte Optimierung' },
      { icon: <Database className="h-5 w-5 text-purple-300" />, title: 'Content-Distribution', subtitle: 'Kanalübergreifende Verbreitung' }
    ],
    primaryCta: {
      text: 'Content-Strategie anfordern',
      href: '/contact/content-strategie'
    },
    secondaryCta: {
      text: 'Content-Services entdecken',
      href: '/content-marketing'
    },
    stats: [
      { value: '10x', label: 'Content-Performance' },
      { value: '62%', label: 'Höheres Engagement' },
      { value: '44%', label: 'Mehr Leads' }
    ],
    visualType: 'content',
    color: 'purple',
  },
  {
    id: 'web-analytics',
    badge: 'Datengetriebene Entscheidungen',
    title: 'Web Analytics',
    subtitle: 'Lückenlose Performance-Messung für bessere Entscheidungen',
    description: 'Unsere Analytics-Lösungen decken verborgene Potenziale in Ihren Daten auf und ermöglichen faktenbasierte Marketing-Entscheidungen, die Ihre Conversion-Rate und ROI messbar steigern.',
    features: [
      { icon: <BarChart3 className="h-5 w-5 text-amber-300" />, title: 'Tracking-Setup', subtitle: 'Lückenlose Datenerfassung' },
      { icon: <Database className="h-5 w-5 text-amber-300" />, title: 'Datenanalyse', subtitle: 'Tiefgreifende Insights' },
      { icon: <Lock className="h-5 w-5 text-amber-300" />, title: 'DSGVO-konform', subtitle: 'Datenschutzkonforme Messung' },
      { icon: <Code className="h-5 w-5 text-amber-300" />, title: 'Custom Reporting', subtitle: 'Maßgeschneiderte Dashboards' }
    ],
    primaryCta: {
      text: 'Tracking-Audit anfordern',
      href: '/contact/tracking-audit'
    },
    secondaryCta: {
      text: 'Analytics-Services entdecken',
      href: '/web-analytics'
    },
    stats: [
      { value: '89%', label: 'Genauere Daten' },
      { value: '34%', label: 'Höhere Conversions' },
      { value: '58%', label: 'Bessere Entscheidungen' }
    ],
    visualType: 'analytics',
    color: 'amber',
  }
];

export function BrandedHero() {
  const params = usePathname();
  const locale = params.locale as string || 'de';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const localizeHref = (href: string) => {
    if (href.startsWith('/')) {
      return `/${locale}${href}`;
    }
    return href;
  };

  // Handle slide navigation
  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [currentSlide, isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Auto-rotate slides, unless paused
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      if (!isAnimating) {
        nextSlide();
      }
    }, 8000);
    
    return () => clearInterval(interval);
  }, [currentSlide, isAnimating, isPaused, nextSlide]);

  // Determine color based on current slide
  const getColorClass = (slide) => {
    switch(slide.color) {
      case 'green': return 'from-green-950 to-green-800';
      case 'orange': return 'from-orange-950 to-orange-800';
      case 'purple': return 'from-purple-950 to-purple-800';
      case 'amber': return 'from-amber-950 to-amber-800';
      default: return 'from-blue-950 to-blue-900';
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${getColorClass(currentSlideData)} text-white min-h-[700px]`}
         onMouseEnter={() => setIsPaused(true)}
         onMouseLeave={() => setIsPaused(false)}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <svg className="absolute h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500/10 backdrop-blur-3xl"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [Math.random() * 50, Math.random() * -50, Math.random() * 50],
              x: [Math.random() * 50, Math.random() * -50, Math.random() * 50],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/20 backdrop-blur-sm p-3 text-white hover:bg-black/40 transition-all duration-300 hidden sm:block"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/20 backdrop-blur-sm p-3 text-white hover:bg-black/40 transition-all duration-300 hidden sm:block"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-20 sm:py-32">
          <div className="grid grid-cols-1 gap-x-16 gap-y-20 lg:grid-cols-2">
            {/* Content */}
            <div className="self-center">
              <AnimatePresence mode="wait">
              <motion.div
                  key={`content-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                className="relative"
              >
                  <div className="mb-4 flex">
                    <Badge className="px-3 py-1 bg-blue-600/20 border-blue-600/30 text-blue-200 backdrop-blur-sm">
                      {currentSlideData.badge}
                    </Badge>
                  </div>
                  
                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-3">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      {currentSlideData.title.split(' ')[0]}
                  </span>
                    <span> {currentSlideData.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                  
                  <h2 className="text-2xl font-medium text-blue-200 mt-2 mb-4">
                    {currentSlideData.subtitle}
                  </h2>
                  
                  <p className="mt-4 text-lg leading-8 text-gray-300">
                    {currentSlideData.description}
                  </p>
                  
                  {/* Key Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {currentSlideData.stats.map((stat, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                      >
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-blue-200">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {currentSlideData.features.map((feature, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                          {feature.icon}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-white">{feature.title}</p>
                          <p className="text-xs text-gray-400">{feature.subtitle}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <Link href={localizeHref(currentSlideData.primaryCta.href)}>
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                        {currentSlideData.primaryCta.text}
                        <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                    </Link>
                    <Link href={localizeHref(currentSlideData.secondaryCta.href)}>
                      <Button variant="outline" size="lg" className="bg-transparent border-blue-500/30 text-blue-200 hover:bg-blue-900/30">
                        {currentSlideData.secondaryCta.text}
                  </Button>
                    </Link>
                </div>
              </motion.div>
              </AnimatePresence>
            </div>

            {/* Technical Visualization */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`visual-${currentSlide}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="relative lg:self-center"
              >
                <div className="relative bg-blue-950/50 backdrop-blur-xl p-4 lg:p-8 rounded-2xl border border-blue-800/50 shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-purple-600/5 rounded-2xl" />
                  
                  {currentSlideData.visualType === 'dashboard' && (
                    <div className="relative z-10 text-white space-y-3">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-blue-900/50 p-2 rounded">
                          <div className="text-xs text-blue-300 mb-1">Automationsgrad</div>
                          <div className="h-3 bg-blue-800/70 rounded overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                              initial={{ width: 0 }}
                              animate={{ width: "78%" }}
                              transition={{ delay: 0.3, duration: 0.8 }}
                            />
                          </div>
                          <div className="text-right text-xs mt-1">78%</div>
                        </div>
                        <div className="bg-blue-900/50 p-2 rounded">
                          <div className="text-xs text-blue-300 mb-1">Marketing ROI</div>
                          <div className="h-3 bg-blue-800/70 rounded overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-400"
                              initial={{ width: 0 }}
                              animate={{ width: "43%" }}
                              transition={{ delay: 0.4, duration: 0.8 }}
                            />
                          </div>
                          <div className="text-right text-xs mt-1">+43%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-blue-900/40 p-3 rounded">
                        <div className="text-sm font-medium">API Integration Status</div>
                        <div className="flex items-center text-green-300 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Connected
                        </div>
                      </div>
                      
                      {/* Dashboard Charts */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[...Array(6)].map((_, i) => (
                          <motion.div 
                            key={i}
                            className="h-12 bg-blue-900/30 rounded"
                            initial={{ height: 0 }}
                            animate={{ height: [0, Math.random() * 30 + 20] }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                          />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <div className="bg-blue-900/40 p-3 rounded">
                          <div className="flex justify-between text-xs text-blue-300 mb-2">
                            <span>Campaign Performance</span>
                            <span>+24%</span>
                          </div>
                          <div className="flex items-end h-20 space-x-1">
                            {[...Array(7)].map((_, i) => (
                              <motion.div 
                                key={i}
                                className="bg-blue-500/60 flex-1 rounded-t"
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 70 + 30}%` }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="relative bg-blue-900/40 p-3 rounded-lg h-32">
                          <div className="text-xs text-blue-300 mb-3">Conversion Flow</div>
                          <svg viewBox="0 0 100 60" className="w-full h-full">
                            <motion.path
                              d="M 0,30 Q 20,10 40,35 T 80,30 T 100,20"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.6, duration: 1.5 }}
                            />
                            <motion.path
                              d="M 0,40 Q 30,55 50,30 T 100,40"
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.8, duration: 1.5 }}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentSlideData.visualType === 'graph' && (
                    <div className="relative z-10 text-white space-y-4">
                      <div className="bg-green-900/40 p-3 rounded">
                        <div className="flex justify-between mb-2">
                          <div className="text-sm font-medium">Organic Traffic Growth</div>
                          <div className="text-green-300 text-xs flex items-center">
                            <ArrowRight className="h-3 w-3 mr-1" /> +47%
                          </div>
                        </div>
                        <div className="h-32 relative">
                          <svg viewBox="0 0 100 40" className="w-full h-full">
                            <defs>
                              <linearGradient id="seoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <motion.path
                              d="M 0,35 C 10,32 20,30 30,25 C 40,20 50,10 60,8 C 70,6 80,12 90,5 L 100,3 L 100,40 L 0,40 Z"
                              fill="url(#seoGradient)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4, duration: 0.8 }}
                            />
                            <motion.path
                              d="M 0,35 C 10,32 20,30 30,25 C 40,20 50,10 60,8 C 70,6 80,12 90,5 L 100,3"
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.3, duration: 1.5 }}
                            />
                </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-900/30 p-3 rounded">
                          <div className="text-xs text-green-300 mb-2">Keyword-Rankings</div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs">TOP 3</div>
                            <div className="text-right text-xs">+8</div>
                          </div>
                          <div className="h-3 bg-green-800/30 rounded overflow-hidden mb-2">
                            <motion.div 
                              className="h-full bg-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: "65%" }}
                              transition={{ delay: 0.5, duration: 0.8 }}
                            />
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs">TOP 10</div>
                            <div className="text-right text-xs">+12</div>
                          </div>
                          <div className="h-3 bg-green-800/30 rounded overflow-hidden">
                            <motion.div 
                              className="h-full bg-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: "83%" }}
                              transition={{ delay: 0.6, duration: 0.8 }}
                            />
                          </div>
                        </div>
                        
                        <div className="bg-green-900/30 p-3 rounded">
                          <div className="text-xs text-green-300 mb-2">Conversions</div>
                          <div className="text-lg font-bold text-white mb-1">+63%</div>
                          <div className="text-xs text-green-200">vs. Vorperiode</div>
                          <div className="mt-2 flex items-end h-14 space-x-1">
                            {[...Array(6)].map((_, i) => (
                              <motion.div 
                                key={i}
                                className="bg-green-500/60 flex-1 rounded-t"
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 50 + 50}%` }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }}
                              />
                            ))}
                          </div>
                        </div>
                  </div>
                    </div>
                  )}
                  
                  {currentSlideData.visualType === 'chart' && (
                    <div className="relative z-10 text-white space-y-4">
                      <div className="bg-orange-900/40 p-3 rounded">
                        <div className="flex justify-between mb-2">
                          <div className="text-sm font-medium">Google Ads Performance</div>
                          <div className="text-orange-300 text-xs flex items-center">
                            <ArrowRight className="h-3 w-3 mr-1" /> Last 30 days
                          </div>
                        </div>
                        <div className="h-32 relative">
                          <svg viewBox="0 0 100 40" className="w-full h-full">
                            <defs>
                              <linearGradient id="adsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <motion.path
                              d="M 0,30 C 5,28 10,20 15,18 C 20,16 25,18 30,16 C 35,14 40,8 45,10 C 50,12 55,22 60,20 C 65,18 70,10 75,8 C 80,6 85,10 90,8 L 95,5 L 100,3 L 100,40 L 0,40 Z"
                              fill="url(#adsGradient)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4, duration: 0.8 }}
                            />
                            <motion.path
                              d="M 0,30 C 5,28 10,20 15,18 C 20,16 25,18 30,16 C 35,14 40,8 45,10 C 50,12 55,22 60,20 C 65,18 70,10 75,8 C 80,6 85,10 90,8 L 95,5 L 100,3"
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.3, duration: 1.5 }}
                            />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-orange-900/30 p-3 rounded text-center">
                          <div className="text-xs text-orange-300 mb-1">CTR</div>
                          <div className="text-lg font-bold text-white">+22%</div>
                        </div>
                        <div className="bg-orange-900/30 p-3 rounded text-center">
                          <div className="text-xs text-orange-300 mb-1">CPA</div>
                          <div className="text-lg font-bold text-white">-32%</div>
                        </div>
                        <div className="bg-orange-900/30 p-3 rounded text-center">
                          <div className="text-xs text-orange-300 mb-1">ROAS</div>
                          <div className="text-lg font-bold text-white">4.2x</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-900/30 p-3 rounded">
                          <div className="text-xs text-orange-300 mb-1">Campaign Overview</div>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Search</span>
                              <div className="flex items-center">
                                <span className="text-green-300 mr-1">●</span>Active
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>Display</span>
                              <div className="flex items-center">
                                <span className="text-green-300 mr-1">●</span>Active
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>Shopping</span>
                              <div className="flex items-center">
                                <span className="text-amber-300 mr-1">●</span>Optimizing
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span>PMax</span>
                              <div className="flex items-center">
                                <span className="text-green-300 mr-1">●</span>Active
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-orange-900/30 p-3 rounded">
                          <div className="text-xs text-orange-300 mb-1">Conversions</div>
                          <div className="text-lg font-bold text-white mb-1">+37%</div>
                          <div className="w-full bg-orange-900/40 h-4 rounded overflow-hidden mt-2">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                              initial={{ width: 0 }}
                              animate={{ width: "42%" }}
                              transition={{ delay: 0.6, duration: 1 }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs">
                            <span>Previous</span>
                            <span>Current</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 