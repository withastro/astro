'use client';

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Code, Database, Globe, Layout, Smartphone } from "lucide-react";
import { ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon, Globe as GlobeIcon, Code as CodeIcon, Layers, Database as DatabaseIcon, Smartphone as SmartphoneIcon, Lightbulb, ShieldCheck, Zap, Palette } from 'lucide-react';

// Define slide data for website development services
const slides = [
  {
    id: 'custom-websites',
    badge: 'Individuelle Webseiten',
    title: 'Maßgeschneiderte Websites',
    subtitle: 'Einzigartige Webpräsenzen für Ihren Erfolg',
    description: 'Wir entwickeln maßgeschneiderte Websites, die Ihre Marke perfekt repräsentieren. Von der Konzeption über das Design bis zur Umsetzung – wir schaffen digitale Erlebnisse, die begeistern und konvertieren.',
    features: [
      { icon: <Palette className="h-5 w-5 text-blue-300" />, title: 'Individuelles Design', subtitle: 'Einzigartiger Look' },
      { icon: <CodeIcon className="h-5 w-5 text-blue-300" />, title: 'Moderne Technologien', subtitle: 'Zukunftssichere Lösungen' },
      { icon: <SmartphoneIcon className="h-5 w-5 text-blue-300" />, title: 'Responsive Design', subtitle: 'Optimiert für alle Geräte' },
      { icon: <Zap className="h-5 w-5 text-blue-300" />, title: 'Performance-Fokus', subtitle: 'Schnelle Ladezeiten' }
    ],
    primaryCta: 'Unverbindliches Angebot',
    secondaryCta: 'Portfolio ansehen',
    visualType: 'custom',
    color: 'blue',
  },
  {
    id: 'ecommerce',
    badge: 'E-Commerce',
    title: 'Online Shop Lösungen',
    subtitle: 'Professionelle Shops für Ihren Verkaufserfolg',
    description: 'Wir entwickeln leistungsstarke E-Commerce-Plattformen, die Verkäufe fördern und das Einkaufserlebnis optimieren. Mit benutzerfreundlichen Funktionen und sicheren Zahlungslösungen steigern wir Ihren Online-Umsatz.',
    features: [
      { icon: <GlobeIcon className="h-5 w-5 text-pink-300" />, title: 'Shop-Systeme', subtitle: 'Shopify, WooCommerce, Magento' },
      { icon: <DatabaseIcon className="h-5 w-5 text-pink-300" />, title: 'Produktverwaltung', subtitle: 'Einfache Administration' },
      { icon: <ShieldCheck className="h-5 w-5 text-pink-300" />, title: 'Sichere Zahlung', subtitle: 'Alle gängigen Zahlungsarten' },
      { icon: <SmartphoneIcon className="h-5 w-5 text-pink-300" />, title: 'Mobile Shopping', subtitle: 'Optimiert für Mobilgeräte' }
    ],
    primaryCta: 'Shop-Beratung vereinbaren',
    secondaryCta: 'Shop-Beispiele',
    visualType: 'ecommerce',
    color: 'pink',
  },
  {
    id: 'web-applications',
    badge: 'Web Anwendungen',
    title: 'Web Applications',
    subtitle: 'Maßgeschneiderte digitale Lösungen',
    description: 'Wir entwickeln komplexe Webanwendungen, die Ihre Geschäftsprozesse digitalisieren und optimieren. Von internen Tools bis zu kundenorientierten Plattformen – wir schaffen digitale Lösungen mit echtem Mehrwert.',
    features: [
      { icon: <CodeIcon className="h-5 w-5 text-purple-300" />, title: 'Frontend-Entwicklung', subtitle: 'React, Angular, Vue' },
      { icon: <DatabaseIcon className="h-5 w-5 text-purple-300" />, title: 'Backend-Entwicklung', subtitle: 'Node.js, PHP, Python' },
      { icon: <Lightbulb className="h-5 w-5 text-purple-300" />, title: 'UI/UX Design', subtitle: 'Intuitive Nutzerführung' },
      { icon: <ShieldCheck className="h-5 w-5 text-purple-300" />, title: 'Sicherheit', subtitle: 'Datenschutz & Compliance' }
    ],
    primaryCta: 'Projekt besprechen',
    secondaryCta: 'Anwendungsbeispiele',
    visualType: 'webapp',
    color: 'purple',
  },
  {
    id: 'content-management',
    badge: 'Content Management',
    title: 'CMS Lösungen',
    subtitle: 'Einfache Verwaltung Ihrer Website-Inhalte',
    description: 'Wir implementieren benutzerfreundliche Content-Management-Systeme, die es Ihnen ermöglichen, Ihre Website selbstständig zu pflegen und zu aktualisieren. Intuitiv, flexibel und anpassbar an Ihre Bedürfnisse.',
    features: [
      { icon: <Layout className="h-5 w-5 text-indigo-300" />, title: 'CMS-Plattformen', subtitle: 'WordPress, Drupal, TYPO3' },
      { icon: <Palette className="h-5 w-5 text-indigo-300" />, title: 'Custom Templates', subtitle: 'Individuelle Designs' },
      { icon: <DatabaseIcon className="h-5 w-5 text-indigo-300" />, title: 'Content-Strukturen', subtitle: 'Flexible Inhaltstypen' },
      { icon: <GlobeIcon className="h-5 w-5 text-indigo-300" />, title: 'Mehrsprachigkeit', subtitle: 'Internationale Websites' }
    ],
    primaryCta: 'CMS-Beratung anfragen',
    secondaryCta: 'CMS-Vergleich',
    visualType: 'cms',
    color: 'indigo',
  },
  {
    id: 'web-maintenance',
    badge: 'Website Betreuung',
    title: 'Website Wartung',
    subtitle: 'Professionelle Betreuung & Pflege Ihrer Website',
    description: 'Wir übernehmen die kontinuierliche Pflege und Wartung Ihrer Website. Von regelmäßigen Updates über Sicherheits-Audits bis hin zu Content-Updates – wir sorgen dafür, dass Ihre Website stets optimal performt.',
    features: [
      { icon: <ShieldCheck className="h-5 w-5 text-green-300" />, title: 'Sicherheitsupdates', subtitle: 'Kontinuierlicher Schutz' },
      { icon: <Zap className="h-5 w-5 text-green-300" />, title: 'Performance-Optimierung', subtitle: 'Maximale Geschwindigkeit' },
      { icon: <DatabaseIcon className="h-5 w-5 text-green-300" />, title: 'Backup-Management', subtitle: 'Regelmäßige Sicherungen' },
      { icon: <Lightbulb className="h-5 w-5 text-green-300" />, title: 'Proaktive Beratung', subtitle: 'Kontinuierliche Verbesserung' }
    ],
    primaryCta: 'Wartungsangebot anfragen',
    secondaryCta: 'Service-Pakete',
    visualType: 'maintenance',
    color: 'green',
  }
];

export function WebseitenEntwicklungHero() {
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
            <pattern id="dev-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dev-grid)"/>
        </svg>
      </div>

      {/* Floating Code Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {["<div>", "<html>", "{ }", "</code>", "</>"].map((text, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/5 backdrop-blur-sm p-3 rounded-lg"
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              y: [Math.random() * 50, Math.random() * -50, Math.random() * 50],
              x: [Math.random() * 50, Math.random() * -50, Math.random() * 50],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <span className="font-mono text-sm md:text-base opacity-70">{text}</span>
          </motion.div>
        ))}
        
        {[CodeIcon, GlobeIcon, DatabaseIcon, Layout, SmartphoneIcon].map((Icon, i) => (
          <motion.div
            key={`icon-${i}`}
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
              {/* Visualization based on slide type */}
              <div className="relative bg-white/10 backdrop-blur-xl p-6 lg:p-8 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Dynamic content based on slide type */}
                {currentSlideData.visualType === 'custom' && (
                  <div className="h-80 flex items-center justify-center">
                    <div className="w-full">
                      <div className="relative mx-auto border-2 border-white/30 rounded-lg overflow-hidden w-full max-w-lg h-60">
                        <div className="absolute top-0 inset-x-0 h-6 bg-white/10 flex items-center px-2">
                          <div className="flex gap-1.5">
                            {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((bg, i) => (
                              <div key={i} className={`w-2.5 h-2.5 rounded-full ${bg}`}></div>
                            ))}
                          </div>
                          <div className="mx-auto h-4 w-56 bg-white/20 rounded-full"></div>
                        </div>
                        
                        <div className="mt-6 p-4 flex flex-col gap-4">
                          <div className="h-16 bg-blue-500/30 backdrop-blur-sm rounded-lg w-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold">Ihre maßgeschneiderte Website</div>
                              <div className="text-xs opacity-80">Individuell designt & entwickelt</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="aspect-square bg-white/10 rounded-lg"></div>
                            ))}
                          </div>
                          
                          <div className="h-8 bg-white/10 rounded-lg w-32 mx-auto"></div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-2 max-w-lg mx-auto">
                        {['Responsive', 'Performance', 'Design'].map((text, i) => (
                          <div key={i} className="bg-white/10 rounded-lg px-3 py-2 text-center text-sm">
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'ecommerce' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold">Online Shop</div>
                      <div className="flex space-x-2">
                        <div className="text-sm bg-pink-500/30 px-2 py-0.5 rounded-full">Shop-System</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-white/5 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-4 gap-3 h-full">
                        <div className="col-span-1 bg-white/10 rounded-lg p-3 overflow-y-auto h-full">
                          <div className="text-xs font-medium mb-2">Kategorien</div>
                          {['Neuheiten', 'Beliebt', 'Sale', 'Kategorie 1', 'Kategorie 2'].map((cat, i) => (
                            <div key={i} className="py-1.5 border-b border-white/10 text-xs">
                              {cat}
                            </div>
                          ))}
                        </div>
                        
                        <div className="col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start h-full overflow-y-auto">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white/10 rounded-lg overflow-hidden flex flex-col pb-1">
                              <div className="aspect-square bg-white/5"></div>
                              <div className="p-2">
                                <div className="h-2 bg-white/20 rounded-full w-full mb-1"></div>
                                <div className="h-2 bg-white/20 rounded-full w-2/3"></div>
                                <div className="mt-2 text-xs font-semibold">€99,00</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="bg-white/10 rounded-full px-3 py-1 text-xs">
                        <span className="font-semibold">Sichere Zahlung</span>
                      </div>
                      <div className="flex space-x-2">
                        {['bg-blue-400/20', 'bg-yellow-400/20', 'bg-red-400/20'].map((bg, i) => (
                          <div key={i} className={`w-8 h-5 rounded ${bg}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'webapp' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-semibold">Webanwendung</div>
                      <div className="flex space-x-2">
                        {[CodeIcon, DatabaseIcon, GlobeIcon].map((Icon, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <Icon className="h-3 w-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex">
                      <div className="w-1/4 border-r border-white/10 pr-3">
                        <div className="text-xs font-medium mb-2">Dashboard</div>
                        {['Übersicht', 'Projekte', 'Aufgaben', 'Berichte', 'Einstellungen'].map((item, i) => (
                          <div key={i} className={`py-2 text-xs rounded ${i === 0 ? 'bg-purple-500/20' : ''} px-2 mb-1`}>
                            {item}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex-1 pl-3">
                        <div className="text-xs font-medium mb-2">Projektübersicht</div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {['Aktive Projekte', 'Abgeschlossen', 'In Bearbeitung', 'Ausstehend'].map((stat, i) => (
                            <div key={i} className="bg-white/10 rounded-lg p-2">
                              <div className="text-xs opacity-70">{stat}</div>
                              <div className="text-lg font-semibold">{Math.floor(Math.random() * 20 + 5)}</div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-2 mb-3">
                          <div className="text-xs font-medium mb-2">Aktuelle Projekte</div>
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="bg-white/10 rounded-lg p-2 flex justify-between items-center">
                                <div>
                                  <div className="text-xs font-medium">Projekt {i+1}</div>
                                  <div className="text-xs opacity-70">Status: aktiv</div>
                                </div>
                                <div className="w-16 bg-purple-500/30 rounded-full h-1.5">
                                  <div 
                                    className="bg-purple-500 h-full rounded-full" 
                                    style={{width: `${Math.random() * 80 + 20}%`}}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'cms' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-semibold">CMS Admin</div>
                      <div className="flex space-x-2">
                        <div className="text-xs bg-indigo-500/30 px-2 py-0.5 rounded-full">Content System</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex">
                      <div className="w-1/4 border-r border-white/10 pr-3">
                        <div className="bg-white/10 rounded-lg p-2 mb-2">
                          <div className="w-full h-8 bg-white/10 rounded-md mb-2"></div>
                          <div className="text-xs">Dashboard</div>
                        </div>
                        {['Seiten', 'Beiträge', 'Medien', 'Templates', 'Einstellungen'].map((item, i) => (
                          <div key={i} className="flex items-center py-2 text-xs border-b border-white/10">
                            <div className="w-4 h-4 bg-white/20 rounded mr-2"></div>
                            {item}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex-1 pl-3">
                        <div className="text-xs font-medium mb-2">Seiten verwalten</div>
                        
                        <div className="bg-white/5 rounded-lg p-2 mb-3">
                          <div className="flex justify-between mb-2">
                            <div className="text-xs">Alle Seiten (12)</div>
                            <div className="bg-white/10 rounded px-2 py-0.5 text-xs">+ Neu</div>
                          </div>
                          
                          <div className="bg-white/10 rounded-md p-2 mb-2">
                            <div className="flex justify-between items-center">
                              <div className="text-xs font-medium">Startseite</div>
                              <div className="flex space-x-1">
                                {['Bearbeiten', 'Ansehen'].map((action, i) => (
                                  <div key={i} className="text-xs px-2 py-0.5 bg-white/10 rounded">
                                    {action}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-md p-2 mb-1 flex justify-between items-center">
                              <div className="text-xs">Unterseite {i+1}</div>
                              <div className="flex space-x-1">
                                {['bg-blue-400/20', 'bg-green-400/20'].map((bg, j) => (
                                  <div key={j} className={`w-5 h-5 rounded-sm ${bg}`}></div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/10 rounded-lg p-2 text-center">
                            <div className="text-xs opacity-70">Sprachen</div>
                            <div className="text-sm font-semibold">DE | EN | FR</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-2 text-center">
                            <div className="text-xs opacity-70">Veröffentlicht</div>
                            <div className="text-sm font-semibold">18 Seiten</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentSlideData.visualType === 'maintenance' && (
                  <div className="h-80 flex flex-col">
                    <div className="flex justify-between mb-4">
                      <div className="text-sm font-semibold">Website Monitoring</div>
                      <div className="text-xs bg-green-500 px-2 py-0.5 rounded-full">Online</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { title: 'Uptime', value: '99.8%', icon: <Zap className="h-4 w-4" /> },
                        { title: 'Sicherheit', value: 'Geschützt', icon: <ShieldCheck className="h-4 w-4" /> },
                        { title: 'Backups', value: 'Täglich', icon: <DatabaseIcon className="h-4 w-4" /> },
                        { title: 'Updates', value: 'Aktuell', icon: <Layout className="h-4 w-4" /> }
                      ].map((item, i) => (
                        <div key={i} className="bg-white/10 rounded-lg p-3 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-xs opacity-70">{item.title}</div>
                            <div className="text-sm font-semibold">{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex-1 bg-white/5 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-medium">System Status</div>
                        <div className="text-xs">Letzte Prüfung: heute</div>
                      </div>
                      
                      <div className="space-y-2">
                        {[
                          { name: 'PHP Version', status: 'Aktuell (8.1)', health: 'good' },
                          { name: 'WordPress Core', status: 'Aktuell (6.3)', health: 'good' },
                          { name: 'Plugins', status: '12/14 aktuell', health: 'warning' },
                          { name: 'SSL-Zertifikat', status: 'Gültig (11 Monate)', health: 'good' },
                          { name: 'Datenbank', status: 'Optimiert', health: 'good' }
                        ].map((item, i) => (
                          <div key={i} className="bg-white/10 rounded-lg p-2 flex justify-between items-center">
                            <div className="text-xs">{item.name}</div>
                            <div className="flex items-center">
                              <div className="text-xs mr-2">{item.status}</div>
                              <div className={`w-3 h-3 rounded-full ${
                                item.health === 'good' ? 'bg-green-500' : 
                                item.health === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-xs opacity-70">Nächste geplante Wartung</div>
                      <div className="text-sm font-semibold">Morgen, 02:00 Uhr</div>
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