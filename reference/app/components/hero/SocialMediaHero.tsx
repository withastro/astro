'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon, Instagram as InstagramIcon, Facebook as FacebookIcon, Twitter as TwitterIcon, Linkedin as LinkedinIcon, Youtube, TrendingUp, Users, BarChart, MessageCircle, Share2, Award } from 'lucide-react';

// Define slide data for social media platforms
const slides = [
  {
    id: 'social-strategy',
    badge: 'Strategie & Beratung',
    title: 'Social Media Strategie',
    subtitle: 'Maßgeschneiderte Strategien für Ihre Unternehmensziele',
    description: 'Wir entwickeln ganzheitliche Social Media Strategien, die perfekt auf Ihre Marke, Zielgruppe und Geschäftsziele abgestimmt sind. Fundiert durch Datenanalyse und Wettbewerbsbeobachtung schaffen wir nachhaltige Erfolge.',
    features: [
      { icon: <Users className="h-5 w-5 text-blue-300" />, title: 'Zielgruppenanalyse', subtitle: 'Präzise Persona-Definition' },
      { icon: <TrendingUp className="h-5 w-5 text-blue-300" />, title: 'Plattform-Auswahl', subtitle: 'Fokus auf relevante Kanäle' },
      { icon: <BarChart className="h-5 w-5 text-blue-300" />, title: 'Performance-Messung', subtitle: 'Klare KPIs und Reportings' },
      { icon: <Award className="h-5 w-5 text-blue-300" />, title: 'Wettbewerbsanalyse', subtitle: 'Identifikation von Chancen' }
    ],
    primaryCta: 'Strategie-Beratung anfragen',
    secondaryCta: 'Mehr erfahren',
    visualType: 'strategy',
    color: 'blue',
  },
  {
    id: 'content-creation',
    badge: 'Content Creation',
    title: 'Social Media Content',
    subtitle: 'Professionelle Inhalte, die begeistern und konvertieren',
    description: 'Unser Kreativteam erstellt maßgeschneiderte Inhalte, die Ihre Marke authentisch repräsentieren. Von aufmerksamkeitsstarken Posts über Story-Formate bis hin zu professionellen Videos – wir sorgen für kontinuierliche Präsenz und Engagement.',
    features: [
      { icon: <InstagramIcon className="h-5 w-5 text-pink-300" />, title: 'Visual Content', subtitle: 'Professionelle Grafiken & Fotos' },
      { icon: <MessageCircle className="h-5 w-5 text-pink-300" />, title: 'Copywriting', subtitle: 'Überzeugende Texte' },
      { icon: <Youtube className="h-5 w-5 text-pink-300" />, title: 'Video-Content', subtitle: 'Animationen & Kurzvideos' },
      { icon: <Share2 className="h-5 w-5 text-pink-300" />, title: 'Content-Plan', subtitle: 'Strategischer Redaktionsplan' }
    ],
    primaryCta: 'Content-Beispiele ansehen',
    secondaryCta: 'Content-Pakete',
    visualType: 'content',
    color: 'pink',
  },
  {
    id: 'community-management',
    badge: 'Community Management',
    title: 'Engagement & Monitoring',
    subtitle: 'Aktive Betreuung Ihrer Social Media Präsenz',
    description: 'Wir übernehmen die kontinuierliche Betreuung Ihrer Social-Media-Kanäle. Vom Monitoring und schnellen Reaktionen auf Kommentare bis hin zum proaktiven Community-Building – wir halten Ihre Community lebendig und wachsend.',
    features: [
      { icon: <MessageCircle className="h-5 w-5 text-purple-300" />, title: 'Reaktionsmanagement', subtitle: 'Schnelle Antwortzeiten' },
      { icon: <Users className="h-5 w-5 text-purple-300" />, title: 'Community-Building', subtitle: 'Aktive Follower-Interaktion' },
      { icon: <Award className="h-5 w-5 text-purple-300" />, title: 'Krisenmanagement', subtitle: 'Proaktive Problemlösung' },
      { icon: <BarChart className="h-5 w-5 text-purple-300" />, title: 'Social Listening', subtitle: 'Markt- & Meinungsanalyse' }
    ],
    primaryCta: 'Community Management anfragen',
    secondaryCta: 'Service-Details',
    visualType: 'community',
    color: 'purple',
  },
  {
    id: 'social-ads',
    badge: 'Social Media Advertising',
    title: 'Social Ads',
    subtitle: 'Performance-orientierte Werbekampagnen',
    description: 'Unsere datengesteuerten Social Media Ads erzielen maximale Reichweite und Conversion. Mit präzisem Targeting, A/B-Testing und kontinuierlicher Optimierung sorgen wir für effiziente Budgetnutzung und messbare Ergebnisse.',
    features: [
      { icon: <FacebookIcon className="h-5 w-5 text-indigo-300" />, title: 'Meta Ads', subtitle: 'Facebook & Instagram Kampagnen' },
      { icon: <LinkedinIcon className="h-5 w-5 text-indigo-300" />, title: 'LinkedIn Ads', subtitle: 'B2B-fokussierte Kampagnen' },
      { icon: <Users className="h-5 w-5 text-indigo-300" />, title: 'Custom Audiences', subtitle: 'Präzises Targeting' },
      { icon: <BarChart className="h-5 w-5 text-indigo-300" />, title: 'ROI-Optimierung', subtitle: 'Datenbasierte Anpassungen' }
    ],
    primaryCta: 'Kampagnen-Check anfordern',
    secondaryCta: 'Ads-Services entdecken',
    visualType: 'ads',
    color: 'indigo',
  },
  {
    id: 'social-analytics',
    badge: 'Performance Analyse',
    title: 'Social Analytics',
    subtitle: 'Datengestützte Entscheidungen für bessere Ergebnisse',
    description: 'Unser umfassendes Social Media Reporting gibt Ihnen tiefe Einblicke in die Performance Ihrer Kanäle. Wir analysieren Trends, identifizieren Optimierungspotentiale und liefern konkrete Handlungsempfehlungen.',
    features: [
      { icon: <BarChart className="h-5 w-5 text-green-300" />, title: 'Performance-Tracking', subtitle: 'Alle relevanten KPIs' },
      { icon: <TrendingUp className="h-5 w-5 text-green-300" />, title: 'Wachstumsanalyse', subtitle: 'Langfristige Entwicklung' },
      { icon: <Users className="h-5 w-5 text-green-300" />, title: 'Audience Insights', subtitle: 'Zielgruppenverständnis' },
      { icon: <Award className="h-5 w-5 text-green-300" />, title: 'Benchmarking', subtitle: 'Wettbewerbsvergleich' }
    ],
    primaryCta: 'Social Audit anfordern',
    secondaryCta: 'Analytics-Details',
    visualType: 'analytics',
    color: 'green',
  }
];

export function SocialMediaHero() {
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
            <pattern id="social-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#social-grid)"/>
        </svg>
      </div>

      {/* Floating Social Icons */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[Instagram, Facebook, Twitter, Linkedin, Youtube].map((SocialIcon, i) => (
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
            <SocialIcon className="w-full h-full opacity-50" />
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
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
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
              {/* Social Media Visualization based on slide type */}
              <div className="relative bg-white/10 backdrop-blur-xl p-6 lg:p-8 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Dynamic content based on slide type */}
                {currentSlideData.visualType === 'strategy' && (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        {[Instagram, Facebook, Linkedin, Twitter, Youtube].map((Icon, i) => (
                          <div key={i} className={`rounded-full p-4 ${i === 0 ? 'col-span-3' : 'col-span-1'} bg-white/10 flex items-center justify-center`}>
                            <Icon className={`h-8 w-8 ${i === 0 ? 'h-12 w-12' : ''}`} />
                          </div>
                        ))}
                      </div>
                      <div className="text-2xl font-bold mb-2">Strategische Planung</div>
                      <div className="text-sm opacity-70">Plattform-optimierte Strategien</div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'content' && (
                  <div className="h-80 grid grid-cols-3 grid-rows-3 gap-2">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className={`rounded-lg overflow-hidden ${i === 4 ? 'col-span-1 row-span-1' : i % 3 === 0 ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1'} bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center`}>
                        {i % 3 === 0 && <InstagramIcon className="h-8 w-8" />}
                        {i % 3 === 1 && <MessageCircle className="h-8 w-8" />}
                        {i % 3 === 2 && <Share2 className="h-8 w-8" />}
                      </div>
                    ))}
                  </div>
                )}
                
                {currentSlideData.visualType === 'community' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 px-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1 bg-white/10 p-3 rounded-lg">
                            <div className="text-sm font-semibold mb-1">User Comment {i+1}</div>
                            <div className="text-xs opacity-70">Beispiel für einen Nutzerkommentar auf einem Social Media Kanal.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 bg-white/10 p-3 rounded-lg flex items-center">
                      <div className="flex-1 text-sm">Schnelle & professionelle Antworten...</div>
                      <Button size="sm" variant="secondary" className="ml-2 bg-white/20">Antworten</Button>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'ads' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex space-x-4 mb-4">
                      {[Facebook, Instagram, Linkedin, Twitter].map((Icon, i) => (
                        <div key={i} className={`p-3 rounded-lg ${i === 0 ? 'bg-white/20' : 'bg-white/10'} flex items-center space-x-2`}>
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">Ads</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 bg-white/10 rounded-lg p-4 flex flex-col">
                      <div className="text-sm font-semibold mb-2">Ad Performance</div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        {['Impressions', 'Clicks', 'Conversions', 'ROAS'].map((metric, i) => (
                          <div key={i} className="bg-white/10 p-3 rounded-lg">
                            <div className="text-xs opacity-70">{metric}</div>
                            <div className="text-lg font-bold">+{Math.floor(Math.random() * 80 + 20)}%</div>
                            <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
                              <div className="bg-white h-full rounded-full" style={{width: `${Math.random() * 80 + 20}%`}}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'analytics' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex justify-between mb-4">
                      <div className="text-sm font-semibold">Social Performance</div>
                      <div className="flex space-x-2">
                        {[TrendingUp, BarChart, Users].map((Icon, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="col-span-4 bg-white/10 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs opacity-70">Growth Trend</div>
                          <TrendingUp className="h-4 w-4 opacity-70" />
                        </div>
                        <div className="h-24 flex items-end space-x-1">
                          {[...Array(24)].map((_, i) => (
                            <div 
                              key={i} 
                              className="flex-1 bg-white/30 rounded-t-sm" 
                              style={{height: `${Math.sin(i/3) * 50 + 50}%`}}
                            ></div>
                          ))}
                        </div>
                      </div>
                      {['Engagement', 'Reach', 'Followers', 'Conversions'].map((metric, i) => (
                        <div key={i} className="bg-white/10 p-2 rounded-lg flex flex-col items-center justify-center">
                          <div className="text-xs opacity-70">{metric}</div>
                          <div className="text-xl font-bold mt-1">{Math.floor(Math.random() * 90 + 10)}%</div>
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
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
        aria-label="Next slide"
      >
        <ArrowRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
} 