'use client';

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Gauge, LineChart, Timer, Zap } from "lucide-react";
import { Search, BarChart, Smartphone, Globe, Code, FileSearch } from 'lucide-react';

// Define slide data for website optimization services
const slides = [
  {
    id: 'seo-optimization',
    badge: 'SEO Optimierung',
    title: 'Suchmaschinen Optimierung',
    subtitle: 'Bessere Sichtbarkeit in Google & Co.',
    description: 'Mit unserer umfassenden SEO-Strategie verbessern wir Ihre Sichtbarkeit in Suchmaschinen nachhaltig. Wir optimieren Ihre Website technisch und inhaltlich, um organischen Traffic und qualifizierte Leads zu generieren.',
    features: [
      { icon: <Search className="h-5 w-5 text-blue-300" />, title: 'Keyword-Recherche', subtitle: 'Relevante Suchbegriffe' },
      { icon: <FileSearch className="h-5 w-5 text-blue-300" />, title: 'OnPage-Optimierung', subtitle: 'Technische & inhaltliche SEO' },
      { icon: <Globe className="h-5 w-5 text-blue-300" />, title: 'OffPage-Optimierung', subtitle: 'Backlink-Aufbau' },
      { icon: <BarChart className="h-5 w-5 text-blue-300" />, title: 'SEO-Reporting', subtitle: 'Transparente Erfolge' }
    ],
    primaryCta: 'SEO-Analyse anfordern',
    secondaryCta: 'Mehr erfahren',
    visualType: 'seo',
    color: 'blue',
  },
  {
    id: 'page-speed',
    badge: 'Page Speed',
    title: 'Performance Optimierung',
    subtitle: 'Schnellere Ladezeiten für bessere Nutzererfahrung',
    description: 'Wir optimieren die Ladezeit Ihrer Website durch Code-Optimierung, Bildkomprimierung und Caching-Strategien. Eine schnelle Website verbessert nicht nur das Nutzererlebnis, sondern auch Ihre Conversion-Rate und Rankings.',
    features: [
      { icon: <Gauge className="h-5 w-5 text-pink-300" />, title: 'Core Web Vitals', subtitle: 'Google-Leistungswerte' },
      { icon: <Zap className="h-5 w-5 text-pink-300" />, title: 'Ladezeit-Optimierung', subtitle: 'Schnelle Seitendarstellung' },
      { icon: <Code className="h-5 w-5 text-pink-300" />, title: 'Code-Optimierung', subtitle: 'Bereinigung & Minifizierung' },
      { icon: <LineChart className="h-5 w-5 text-pink-300" />, title: 'Caching-Konzepte', subtitle: 'Verbesserte Performance' }
    ],
    primaryCta: 'Performance-Check anfordern',
    secondaryCta: 'Ergebnisse sehen',
    visualType: 'performance',
    color: 'pink',
  },
  {
    id: 'mobile-first',
    badge: 'Mobile First',
    title: 'Responsive Optimierung',
    subtitle: 'Perfekt auf allen Geräten & Bildschirmgrößen',
    description: 'Wir optimieren Ihre Website für ein nahtloses Nutzererlebnis auf allen Geräten – von Smartphones über Tablets bis hin zu Desktop-Bildschirmen. Mobile Optimierung ist heute ein entscheidender Erfolgsfaktor.',
    features: [
      { icon: <Smartphone className="h-5 w-5 text-purple-300" />, title: 'Mobile-First-Design', subtitle: 'Optimiert für Smartphone-Nutzer' },
      { icon: <LineChart className="h-5 w-5 text-purple-300" />, title: 'Responsive Layouts', subtitle: 'Flexible Darstellung' },
      { icon: <Gauge className="h-5 w-5 text-purple-300" />, title: 'Mobile Ladezeit', subtitle: 'Schnell auch mit Mobilfunk' },
      { icon: <Search className="h-5 w-5 text-purple-300" />, title: 'Mobile SEO', subtitle: 'Für Mobile-Index optimiert' }
    ],
    primaryCta: 'Mobile-Check starten',
    secondaryCta: 'Mehr Details',
    visualType: 'mobile',
    color: 'purple',
  },
  {
    id: 'conversion-optimization',
    badge: 'Conversion Optimierung',
    title: 'Conversion Rate Optimierung',
    subtitle: 'Mehr Leads und Verkäufe durch gezielte Optimierung',
    description: 'Wir verwandeln Besucher in Kunden durch strategische Optimierung Ihrer Website. Mit A/B-Tests, Nutzeranalysen und gezielten Anpassungen steigern wir kontinuierlich Ihre Conversion-Rate.',
    features: [
      { icon: <BarChart className="h-5 w-5 text-indigo-300" />, title: 'Datenanalyse', subtitle: 'Nutzerverhalten verstehen' },
      { icon: <LineChart className="h-5 w-5 text-indigo-300" />, title: 'A/B-Testing', subtitle: 'Vergleich von Varianten' },
      { icon: <Zap className="h-5 w-5 text-indigo-300" />, title: 'UX-Optimierung', subtitle: 'Nutzerfreundliches Design' },
      { icon: <Search className="h-5 w-5 text-indigo-300" />, title: 'Funnel-Optimierung', subtitle: 'Conversion-Pfad verbessern' }
    ],
    primaryCta: 'CRO-Potenzial prüfen',
    secondaryCta: 'Case Studies ansehen',
    visualType: 'conversion',
    color: 'indigo',
  },
  {
    id: 'analytics-tracking',
    badge: 'Web Analytics',
    title: 'Tracking & Analyse',
    subtitle: 'Datengestützte Entscheidungen für kontinuierliche Verbesserung',
    description: 'Wir implementieren professionelles Tracking und liefern aussagekräftige Analysen Ihrer Website-Performance. Durch tiefgreifende Insights gewinnen Sie ein umfassendes Verständnis Ihrer Nutzer und können datenbasiert entscheiden.',
    features: [
      { icon: <BarChart className="h-5 w-5 text-green-300" />, title: 'Web Analytics', subtitle: 'Umfassendes Tracking' },
      { icon: <LineChart className="h-5 w-5 text-green-300" />, title: 'Zielgruppenanalyse', subtitle: 'Nutzerverständnis' },
      { icon: <Zap className="h-5 w-5 text-green-300" />, title: 'Event-Tracking', subtitle: 'Interaktionsmessung' },
      { icon: <FileSearch className="h-5 w-5 text-green-300" />, title: 'Custom Reports', subtitle: 'Maßgeschneiderte Berichte' }
    ],
    primaryCta: 'Analytics-Setup anfragen',
    secondaryCta: 'Mehr über Analysen',
    visualType: 'analytics',
    color: 'green',
  }
];

export function WebseitenOptimierungHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        nextSlide();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentSlide, isAnimating]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Determine color based on current slide
  const getColorClass = (slide) => {
    switch(slide.color) {
      case 'pink': return 'from-pink-950 to-pink-800';
      case 'purple': return 'from-purple-950 to-purple-800';
      case 'indigo': return 'from-indigo-950 to-indigo-800';
      case 'green': return 'from-green-950 to-green-800';
      default: return 'from-blue-950 to-blue-800';
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${getColorClass(currentSlideData)} text-white min-h-[700px]`}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <svg className="absolute h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="web-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#web-grid)"/>
        </svg>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[Search, Globe, Gauge, Code, Smartphone].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5 backdrop-blur-xl p-4"
            style={{
              width: `${Math.random() * 30 + 60}px`,
              height: `${Math.random() * 30 + 60}px`,
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              y: [Math.random() * 50, Math.random() * -50, Math.random() * 50],
              x: [Math.random() * 50, Math.random() * -50, Math.random() * 50],
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Icon className="w-full h-full opacity-50" />
          </motion.div>
        ))}
      </div>

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

            {/* Slide Visualization */}
            <motion.div
              key={`visual-${currentSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative lg:self-center"
            >
              {/* Visualization based on slide type */}
              <div className="relative bg-white/10 backdrop-blur-xl p-6 lg:p-8 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Dynamic content based on slide type */}
                {currentSlideData.visualType === 'seo' && (
                  <div className="h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                      <Search className="h-16 w-16 mb-6 text-blue-300" />
                      <div className="bg-white/10 rounded-lg px-4 py-2 mb-4 w-full max-w-sm">
                        <div className="h-6 bg-white/20 rounded mb-3"></div>
                        <div className="flex gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-4 bg-white/20 rounded flex-1"></div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-4 w-24 bg-white/20 rounded"></div>
                          <Search className="h-4 w-4 text-white/60" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="bg-white/10 rounded-lg p-3 flex items-center">
                            <div className="w-6 h-6 rounded-full bg-white/20 mr-2 flex-shrink-0"></div>
                            <div>
                              <div className="h-3 w-16 bg-white/20 rounded mb-1"></div>
                              <div className="h-2 w-12 bg-white/10 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'performance' && (
                  <div className="h-80 flex flex-col items-center justify-center">
                    <div className="relative w-40 h-40 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-pink-400 border-l-transparent border-r-transparent border-b-transparent"
                        style={{ transform: 'rotate(45deg)' }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <Gauge className="h-10 w-10 text-pink-300 mb-1" />
                        <div className="text-2xl font-bold">92/100</div>
                        <div className="text-xs text-white/70">Page Speed</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 w-full">
                      {['LCP', 'FID', 'CLS'].map((metric, i) => (
                        <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                          <div className="text-xs text-white/70 mb-1">{metric}</div>
                          <div className="text-lg font-bold">
                            {i === 0 ? '1.2s' : i === 1 ? '12ms' : '0.05'}
                          </div>
                          <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
                            <div className="bg-green-400 h-full rounded-full" style={{width: `${90 - i * 10}%`}}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'mobile' && (
                  <div className="h-80 flex justify-center items-center">
                    <div className="relative flex items-center justify-center">
                      <div className="relative w-40 border-8 border-white/20 rounded-3xl h-72 mr-6 overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-8 bg-white/10"></div>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/30 rounded-full"></div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white/30"></div>
                        <div className="absolute inset-0 mt-8 grid grid-rows-6 gap-1 p-1">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white/10 rounded flex items-center p-2">
                              {i === 0 ? (
                                <div className="w-full h-full bg-white/10 rounded"></div>
                              ) : (
                                <>
                                  <div className="w-6 h-6 bg-white/20 rounded-full mr-2"></div>
                                  <div className="flex-1">
                                    <div className="h-2 w-3/4 bg-white/20 rounded mb-1"></div>
                                    <div className="h-2 w-1/2 bg-white/10 rounded"></div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="hidden sm:block w-60 border-8 border-white/20 rounded-xl h-48 overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-6 bg-white/10"></div>
                        <div className="absolute top-2 left-4 flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-white/30"></div>
                          ))}
                        </div>
                        <div className="absolute inset-0 mt-6 grid grid-cols-12 grid-rows-4 gap-1 p-1">
                          <div className="col-span-3 row-span-4 bg-white/10 rounded"></div>
                          <div className="col-span-9 row-span-2 bg-white/10 rounded"></div>
                          <div className="col-span-4 row-span-2 bg-white/10 rounded"></div>
                          <div className="col-span-5 row-span-2 bg-white/10 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'conversion' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex justify-between mb-6">
                      <div className="text-sm font-semibold">Conversion Funnel</div>
                      <div className="text-sm text-white/70">+32% nach Optimierung</div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center">
                      {['Besucher', 'Interessenten', 'Leads', 'Kunden'].map((stage, i) => (
                        <div key={i} className="relative" style={{width: `${100 - i * 18}%`}}>
                          <div className="h-12 mb-1 bg-white/10 backdrop-blur rounded-lg flex items-center px-4 justify-between">
                            <span>{stage}</span>
                            <span className="text-sm font-semibold">
                              {Math.floor(5000 / (i + 1))}
                            </span>
                          </div>
                          {i < 3 && (
                            <div className="h-6 w-0.5 bg-white/20 mx-auto"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 w-full mt-6">
                      {['CTR', 'Formular-Abschlüsse', 'Kaufrate'].map((metric, i) => (
                        <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                          <div className="text-xs text-white/70 mb-1">{metric}</div>
                          <div className="text-xl font-bold">+{(i + 2) * 12}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'analytics' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex justify-between mb-4">
                      <div className="text-sm font-semibold">Website Analytics</div>
                      <div className="flex space-x-2">
                        {[BarChart, FileSearch, LineChart].map((Icon, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="col-span-4 bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs opacity-70">Besucher-Trend</div>
                          <BarChart className="h-4 w-4 opacity-70" />
                        </div>
                        <div className="h-24 flex items-end space-x-1">
                          {[...Array(24)].map((_, i) => (
                            <div 
                              key={i} 
                              className="flex-1 bg-green-400/60 rounded-t-sm" 
                              style={{height: `${Math.sin(i/3) * 50 + 50}%`}}
                            ></div>
                          ))}
                        </div>
                      </div>
                      
                      {['Besucher', 'Seitenaufrufe', 'Verweildauer', 'Absprungrate'].map((metric, i) => (
                        <div key={i} className="bg-white/10 p-2 rounded-lg flex flex-col items-center justify-center">
                          <div className="text-xs opacity-70">{metric}</div>
                          <div className="text-xl font-bold mt-1">
                            {i === 0 ? '8.4k' : i === 1 ? '21k' : i === 2 ? '2:43' : '28%'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Decoration elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                  <motion.div
                    className="absolute w-40 h-40 rounded-full border border-white/10"
                    style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute w-60 h-60 rounded-full border border-white/5"
                    style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.05, 0.2] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Slider controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full ${
              currentSlide === index ? 'bg-white' : 'bg-white/30'
            } transition-all duration-300`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
      
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-5 w-5" />
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