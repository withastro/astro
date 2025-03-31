'use client';

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronRight, Globe, LineChart, Search, Target, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoogleAdsHero } from "@/app/components/hero/GoogleAdsHero";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Google Ads services
const googleAdsServices = [
  {
    id: 'search',
    title: 'Google Search Ads',
    description: 'Erreichen Sie potenzielle Kunden genau dann, wenn sie aktiv nach Ihren Produkten oder Dienstleistungen suchen.',
    icon: <Target className="h-10 w-10 text-blue-600" />,
    benefits: [
      'Hohe Conversion-Rate durch gezielte Ansprache',
      'Präzises Keyword-Targeting',
      'Flexibles Budget mit messbarem ROI',
      'Sofortige Sichtbarkeit in den Suchergebnissen'
    ],
    kpis: {
      ctr: '4-6%',
      conversionRate: '3-5%',
      roi: '200-400%'
    }
  },
  {
    id: 'display',
    title: 'Google Display Ads',
    description: 'Steigern Sie Ihre Markenbekanntheit und erreichen Sie potenzielle Kunden auf über zwei Millionen Websites im Google Display-Netzwerk.',
    icon: <LineChart className="h-10 w-10 text-red-600" />,
    benefits: [
      'Großflächige Reichweite auf relevanten Websites',
      'Visuell ansprechende Banner und Rich Media Ads',
      'Präzises Targeting nach Interessen, Themen und demografischen Merkmalen',
      'Effektives Remarketing an bestehende Website-Besucher'
    ],
    kpis: {
      impressions: '100.000+',
      ctr: '0.5-1%',
      brandAwareness: '+30%'
    }
  },
  {
    id: 'video',
    title: 'YouTube Ads',
    description: 'Erzählen Sie Ihre Geschichte mit Bewegtbild und erreichen Sie Ihr Publikum auf der weltweit größten Videoplattform.',
    icon: <Globe className="h-10 w-10 text-yellow-600" />,
    benefits: [
      'Hohe Aufmerksamkeit durch visuelle und auditive Ansprache',
      'Verschiedene Anzeigenformate (TrueView, Bumper Ads, etc.)',
      'Gezielte Ansprache nach Videointeressen und Sehgewohnheiten',
      'Messbarer Einfluss auf Markenbekanntheit und Kaufbereitschaft'
    ],
    kpis: {
      viewRate: '25-40%',
      brandRecall: '+20%',
      engagement: '+15%'
    }
  },
  {
    id: 'shopping',
    title: 'Google Shopping Ads',
    description: 'Präsentieren Sie Ihre Produkte mit Bild, Preis und Shopname direkt in den Google-Suchergebnissen und steigern Sie Ihre E-Commerce-Verkäufe.',
    icon: <Search className="h-10 w-10 text-green-600" />,
    benefits: [
      'Höhere Klickraten durch visuelle Produktdarstellung',
      'Qualifizierte Leads durch Preis- und Produktinformationen',
      'Automatische Aktualisierung aus Ihrem Produktfeed',
      'Perfekt für E-Commerce und Onlineshops'
    ],
    kpis: {
      roas: '400-800%',
      conversionRate: '3-7%',
      aov: '+20%'
    }
  }
];

// Process steps
const adwordsProcess = [
  {
    title: 'Analyse & Strategie',
    description: 'Wir analysieren Ihre Zielgruppe, Mitbewerber und Marktpotenzial, um eine maßgeschneiderte Google Ads Strategie zu entwickeln.',
    icon: <BarChart3 className="h-8 w-8 text-blue-600" />
  },
  {
    title: 'Kampagnen-Setup',
    description: 'Aufbau professioneller Kampagnenstrukturen mit optimaler Ausrichtung auf Ihre Geschäftsziele und zielgerichteter Anzeigengestaltung.',
    icon: <Target className="h-8 w-8 text-blue-600" />
  },
  {
    title: 'Kontinuierliche Optimierung',
    description: 'Laufende Überwachung und Anpassung Ihrer Kampagnen für maximale Performance und effiziente Budgetnutzung.',
    icon: <LineChart className="h-8 w-8 text-blue-600" />
  },
  {
    title: 'Reporting & Analyse',
    description: 'Transparente Berichterstattung mit klaren KPIs und Insights zur kontinuierlichen Verbesserung Ihrer Kampagnen.',
    icon: <BarChart3 className="h-8 w-8 text-blue-600" />
  }
];

// Case studies
const caseStudies = [
  {
    client: 'E-Commerce Shop',
    industry: 'Mode & Bekleidung',
    challenge: 'Steigerung der Online-Verkäufe bei gleichzeitiger Reduzierung der Akquisitionskosten',
    solution: 'Implementierung einer gezielten Google Shopping-Kampagne mit dynamischem Remarketing und AI-basierten Gebotsstrategien',
    results: {
      roas: '+320%',
      sales: '+45%',
      cpa: '-30%'
    },
    color: '#4285F4', // Google blue
    pattern: 'shopping'
  },
  {
    client: 'B2B Software Anbieter',
    industry: 'SaaS & Technologie',
    challenge: 'Generierung qualifizierter Leads mit komplexem B2B-Verkaufszyklus',
    solution: 'Mehrstufige Search- und Display-Kampagnenstrategie mit KI-gestütztem Keyword-Targeting',
    results: {
      leads: '+65%',
      leadQuality: '+40%',
      cpl: '-25%'
    },
    color: '#EA4335', // Google red
    pattern: 'technology'
  },
  {
    client: 'Lokaler Dienstleister',
    industry: 'Handwerk & Service',
    challenge: 'Steigerung der lokalen Sichtbarkeit und Anfragen in einem hart umkämpften Markt',
    solution: 'Lokale Such- und Maps-Kampagnen mit automatisiertem Geo-Targeting und KI-optimierten Anzeigentexten',
    results: {
      calls: '+80%',
      localVisibility: '+120%',
      roi: '+250%'
    },
    color: '#34A853', // Google green
    pattern: 'local'
  }
];

export default function GoogleWerbungPage() {
  const params = usePathname();
  const locale = params.locale as string || 'de';

  const localizeHref = (href: string) => {
    if (href.startsWith('/')) {
      return `/${locale}${href}`;
    }
    return href;
  };

  return (
    <div>
      {/* Hero Section */}
      <GoogleAdsHero />
      
      {/* Introduction Section */}
      <section className="py-16 bg-white" id="intro">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Zertifizierte Google Ads Spezialisten für Ihren Erfolg
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Als zertifizierter Google Premier Partner mit über 15 Jahren Erfahrung im Performance Marketing entwickeln wir maßgeschneiderte Google Ads Strategien, die nachweislich zu mehr Conversions, höherem ROI und nachhaltigem Wachstum führen.
            </motion.p>
            <motion.p 
              className="text-lg text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Unsere datengetriebenen Kampagnen kombinieren strategische Planung, kreative Umsetzung und kontinuierliche Optimierung für maximale Effizienz Ihres Werbebudgets.
            </motion.p>
            
            {/* Google Partner Badge */}
            <motion.div
              className="mt-8 flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-gray-50 px-6 py-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500 mb-2">Zertifizierter</div>
                <div className="font-bold text-xl mb-1">Google Premier Partner</div>
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="outline" className="bg-blue-50">Search</Badge>
                  <Badge variant="outline" className="bg-red-50">Display</Badge>
                  <Badge variant="outline" className="bg-yellow-50">Video</Badge>
                  <Badge variant="outline" className="bg-green-50">Shopping</Badge>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50" id="services">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Unsere Google Ads Leistungen
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Umfassende Betreuung Ihrer Google Ads Kampagnen für maximale Sichtbarkeit und Conversions
            </motion.p>
          </div>

          <Tabs defaultValue="search" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-4 mb-8">
              {googleAdsServices.map((service) => (
                <TabsTrigger key={service.id} value={service.id} className="text-center py-3">
                  <div className="flex flex-col items-center">
                    <div className="mb-2">{service.icon}</div>
                    <span>{service.title.split(' ')[1]}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {googleAdsServices.map((service) => (
              <TabsContent key={service.id} value={service.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-sm p-6 md:p-8"
                >
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <div className="mb-6">
                        {service.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      
                      <h4 className="font-bold text-lg mb-3">Ihre Vorteile:</h4>
                      <ul className="space-y-2 mb-6">
                        {service.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <ChevronRight className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link href={localizeHref("/contact/google-analyse")}>
                        <Button>Kostenlose Kampagnen-Analyse</Button>
                      </Link>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-4">Leistungskennzahlen</h4>
                      <div className="space-y-4">
                        {Object.entries(service.kpis).map(([key, value], index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1">
                              {key === 'ctr' && 'Click-Through-Rate'}
                              {key === 'conversionRate' && 'Conversion-Rate'}
                              {key === 'roi' && 'Return on Investment'}
                              {key === 'roas' && 'Return on Ad Spend'}
                              {key === 'impressions' && 'Impressions'}
                              {key === 'brandAwareness' && 'Steigerung der Markenbekanntheit'}
                              {key === 'viewRate' && 'View Rate'}
                              {key === 'brandRecall' && 'Brand Recall'}
                              {key === 'engagement' && 'Engagement-Steigerung'}
                              {key === 'aov' && 'Steigerung des Warenkorbs'}
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 text-sm text-gray-500 italic">
                        Durchschnittliche Werte basierend auf unseren Kundenkampagnen
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
      
      {/* AI & Automation Section */}
      <section className="py-16 bg-white" id="ai-automation">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              KI & Automation für Google Ads
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Revolutionieren Sie Ihre Werbekampagnen mit fortschrittlicher KI-Technologie
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative h-full">
                <svg viewBox="0 0 400 400" className="w-full h-auto">
                  <defs>
                    <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4285F4" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#4285F4" stopOpacity="0.05" />
                    </linearGradient>
                    <pattern id="techGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4285F4" strokeWidth="0.5" strokeOpacity="0.2" />
                    </pattern>
                  </defs>
                  
                  {/* Background */}
                  <rect width="100%" height="100%" fill="url(#gridGradient)" />
                  <rect width="100%" height="100%" fill="url(#techGrid)" />
                  
                  {/* Central CPU */}
                  <motion.g
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                    <rect x="150" y="150" width="100" height="100" rx="10" fill="#4285F4" />
                    <text x="200" y="205" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">AI</text>
                  </motion.g>
                  
                  {/* Connection lines */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const radians = angle * Math.PI / 180;
                    const x1 = 200 + 50 * Math.cos(radians);
                    const y1 = 200 + 50 * Math.sin(radians);
                    const x2 = 200 + 150 * Math.cos(radians);
                    const y2 = 200 + 150 * Math.sin(radians);
                    
                    return (
                      <motion.line 
                        key={i}
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="#4285F4" 
                        strokeWidth="2" 
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                      />
                    );
                  })}
                  
                  {/* Data nodes */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const radians = angle * Math.PI / 180;
                    const cx = 200 + 150 * Math.cos(radians);
                    const cy = 200 + 150 * Math.sin(radians);
                    
                    return (
                      <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                      >
                        <circle cx={cx} cy={cy} r="15" fill="white" stroke="#4285F4" strokeWidth="2" />
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#4285F4" fontSize="10">
                          {['CPC', 'CTR', 'CVR', 'CPA', 'ROI', 'KPI', 'GEO', 'BID'][i]}
                        </text>
                      </motion.g>
                    );
                  })}
                  
                  {/* Animated data pulses */}
                  {[0, 90, 180, 270].map((angle, i) => {
                    const radians = angle * Math.PI / 180;
                    
                    return (
                      <motion.circle
                        key={i}
                        cx={200}
                        cy={200}
                        r="5"
                        fill="#4285F4"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          x: [0, 150 * Math.cos(radians)],
                          y: [0, 150 * Math.sin(radians)],
                          opacity: [1, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          delay: i * 0.5,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      />
                    );
                  })}
                </svg>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col justify-center"
            >
              <h3 className="text-2xl font-bold mb-6">Unsere KI-gestützten Automatisierungslösungen</h3>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-5 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Smart Bidding & Automatische Gebotsstrategien</h4>
                  <p className="text-gray-700">
                    Unsere proprietären KI-Algorithmen arbeiten mit den Google Ads Smart Bidding Strategien und optimieren diese zusätzlich durch eigene Datenmodelle. Das Ergebnis: Maximale Conversion-Raten bei optimierten Kosten.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Automatisierte Performance-Analyse</h4>
                  <p className="text-gray-700">
                    Kontinuierliche Überwachung aller relevanten KPIs mit automatisierten Alerts bei Abweichungen. Unser System identifiziert Optimierungspotenziale, bevor sie zum Problem werden.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">Dynamische Anzeigenkreation</h4>
                  <p className="text-gray-700">
                    KI-gestützte Erstellung von Anzeigentexten und -erweiterungen basierend auf Performance-Daten und Konkurrenzanalyse. Unsere Systeme testen kontinuierlich neue Varianten für maximale Klickraten.
                  </p>
                </div>
                
                <div className="mt-8">
                  <Link href={localizeHref("/contact/google-analyse")}>
                    <Button className="w-full sm:w-auto">
                      KI-Potenzialanalyse für Ihre Kampagnen
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Process Section */}
      <section className="py-16 bg-white" id="process">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Unser Google Ads Prozess
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Methodische Vorgehensweise für nachhaltige Werbeerfolge
            </motion.p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {adwordsProcess.map((step, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    {step.icon}
                  </div>
                  <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-3">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
            
            {/* Process Details */}
            <motion.div 
              className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 md:p-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-xl font-bold mb-4">Was uns auszeichnet</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <div className="flex items-center mb-3">
                    <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="font-bold">Datengetriebener Ansatz</h4>
                  </div>
                  <p className="text-gray-600">Alle Entscheidungen basieren auf gründlicher Datenanalyse und kontinuierlicher Leistungsmessung.</p>
                </div>
                
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <div className="flex items-center mb-3">
                    <LineChart className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="font-bold">Transparente Kommunikation</h4>
                  </div>
                  <p className="text-gray-600">Klare Berichterstattung und offene Kommunikation über alle KPIs und Optimierungsmaßnahmen.</p>
                </div>
                
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <div className="flex items-center mb-3">
                    <Users className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="font-bold">Expertise & Erfahrung</h4>
                  </div>
                  <p className="text-gray-600">Zertifizierte Google Ads Spezialisten mit über 15 Jahren Erfahrung in verschiedenen Branchen.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Case Studies */}
      <section className="py-16 bg-gray-50" id="case-studies">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Erfolgsgeschichten
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Referenzprojekte, die unsere Expertise unter Beweis stellen
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-40 bg-gray-50 relative">
                  <svg viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={study.color} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={study.color} stopOpacity="0.3" />
                      </linearGradient>
                      
                      {/* Shopping pattern */}
                      {study.pattern === 'shopping' && (
                        <pattern id="shoppingPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                          <rect width="40" height="40" fill={`${study.color}22`} />
                          <path d="M 15 10 L 25 10 L 25 30 L 15 30 Z" fill="white" fillOpacity="0.3" stroke={study.color} strokeWidth="1" />
                          <path d="M 18 5 L 22 5 L 22 10 L 18 10 Z" fill="white" fillOpacity="0.3" stroke={study.color} strokeWidth="1" />
                          <path d="M 10 20 L 30 20" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                        </pattern>
                      )}
                      
                      {/* Technology pattern */}
                      {study.pattern === 'technology' && (
                        <pattern id="technologyPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                          <rect width="40" height="40" fill={`${study.color}22`} />
                          <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                          <circle cx="20" cy="20" r="12" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
                          <path d="M 20 8 L 20 32" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                          <path d="M 8 20 L 32 20" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                        </pattern>
                      )}
                      
                      {/* Local pattern */}
                      {study.pattern === 'local' && (
                        <pattern id="localPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                          <rect width="40" height="40" fill={`${study.color}22`} />
                          <path d="M 20 10 L 20 30" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                          <circle cx="20" cy="15" r="5" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                          <path d="M 12 25 L 28 25 L 28 30 L 12 30 Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                        </pattern>
                      )}
                    </defs>
                    
                    {/* Background fill */}
                    <rect width="100%" height="100%" fill={`url(#gradient-${index})`} />
                    
                    {/* Pattern overlay */}
                    <rect width="100%" height="100%" fill={`url(#${study.pattern}Pattern)`} />
                    
                    {/* Abstract shapes based on pattern type */}
                    {study.pattern === 'shopping' && (
                      <g>
                        <motion.circle 
                          cx="50" 
                          cy="50" 
                          r="20" 
                          fill="white" 
                          fillOpacity="0.1" 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        />
                        <motion.rect 
                          x="200" 
                          y="30" 
                          width="30" 
                          height="30" 
                          fill="white" 
                          fillOpacity="0.1" 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                        <motion.rect 
                          x="230" 
                          y="100" 
                          width="20" 
                          height="20" 
                          fill="white" 
                          fillOpacity="0.1" 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        />
                      </g>
                    )}
                    
                    {study.pattern === 'technology' && (
                      <g>
                        <motion.line 
                          x1="20" 
                          y1="20" 
                          x2="280" 
                          y2="20" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeOpacity="0.2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                        <motion.line 
                          x1="20" 
                          y1="80" 
                          x2="280" 
                          y2="80" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeOpacity="0.2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        />
                        <motion.line 
                          x1="20" 
                          y1="140" 
                          x2="280" 
                          y2="140" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeOpacity="0.2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, delay: 0.6 }}
                        />
                      </g>
                    )}
                    
                    {study.pattern === 'local' && (
                      <g>
                        <motion.circle 
                          cx="150" 
                          cy="80" 
                          r="30" 
                          fill="none" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeOpacity="0.2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        />
                        <motion.path 
                          d="M 120 80 L 150 50 L 180 80 L 150 110 Z" 
                          fill="none" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeOpacity="0.2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        />
                      </g>
                    )}
                    
                    {/* Industry label */}
                    <rect x="10" y="120" width="120" height="25" rx="5" fill="white" fillOpacity="0.9" />
                    <text x="20" y="138" fill={study.color} fontWeight="bold" fontSize="12">{study.industry}</text>
                  </svg>
                </div>
                
                <div className="p-6">
                  <Badge className="mb-3">{study.industry}</Badge>
                  <h3 className="font-bold text-xl mb-3">{study.client}</h3>
                  
                  <h4 className="font-medium text-gray-800 mb-1">Herausforderung:</h4>
                  <p className="text-gray-600 mb-3 text-sm">{study.challenge}</p>
                  
                  <h4 className="font-medium text-gray-800 mb-1">Lösung:</h4>
                  <p className="text-gray-600 mb-4 text-sm">{study.solution}</p>
                  
                  <h4 className="font-medium text-gray-800 mb-2">Ergebnisse:</h4>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(study.results).map(([key, value], idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-blue-600 font-bold">{value}</div>
                        <div className="text-xs text-gray-500">
                          {key === 'roas' && 'ROAS'}
                          {key === 'sales' && 'Verkäufe'}
                          {key === 'cpa' && 'CPA'}
                          {key === 'leads' && 'Leads'}
                          {key === 'leadQuality' && 'Qualität'}
                          {key === 'cpl' && 'CPL'}
                          {key === 'calls' && 'Anrufe'}
                          {key === 'localVisibility' && 'Sichtbarkeit'}
                          {key === 'roi' && 'ROI'}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    Case Study ansehen
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Bereit für mehr Conversions?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Lassen Sie uns gemeinsam Ihre Google Ads Strategie auf das nächste Level bringen. Unsere Experten analysieren Ihre aktuelle Performance und identifizieren Potenziale für nachhaltige Verbesserungen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={localizeHref("/contact/google-analyse")}>
                <Button size="lg" variant="secondary">
                  Kostenlose Google Ads Analyse
                </Button>
              </Link>
              <Link href={localizeHref("/contact")}>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Beratungsgespräch vereinbaren
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50" id="faq">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Häufig gestellte Fragen
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Antworten auf Ihre wichtigsten Fragen zu Google Ads
            </motion.p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Welches Budget benötige ich für Google Ads?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Das optimale Budget hängt von verschiedenen Faktoren ab, darunter Ihre Branche, Wettbewerbsdichte, geografischer Fokus und Geschäftsziele. Wir empfehlen für KMUs in der Regel ein Startbudget von mindestens 1.000€ monatlich, um aussagekräftige Daten zu sammeln und erste Erfolge zu erzielen. Nach einer initialen Testphase können wir gemeinsam das Budget skalieren oder anpassen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Wie lange dauert es, bis Google Ads Ergebnisse zeigt?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Google Search Ads können unmittelbar nach Kampagnenstart erste Klicks und Conversions generieren. Für die vollständige Optimierung und das Erreichen der Ziel-KPIs sollten Sie jedoch mit einer Anlaufzeit von 2-3 Monaten rechnen. In dieser Zeit sammeln wir wertvolle Daten, testen verschiedene Ansätze und optimieren kontinuierlich für beste Performance.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Arbeiten Sie mit festen Verträgen oder monatlich kündbar?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Wir bieten flexible Vertragsmodelle an, die auf Ihre Bedürfnisse zugeschnitten sind. Für langfristige Kooperationen empfehlen wir eine initiale Zusammenarbeit von mindestens 3-6 Monaten, um nachhaltigen Erfolg zu gewährleisten. Alle unsere Verträge haben jedoch eine monatliche Kündigungsfrist, da wir durch Qualität und Ergebnisse überzeugen möchten, nicht durch lange Vertragsbindungen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Gehört mir das Google Ads Konto?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Absolut. Ihr Google Ads Konto gehört immer Ihnen. Wir arbeiten transparent als Agentur in Ihrem Konto und stellen sicher, dass Sie jederzeit vollen Zugriff und Einblick haben. Bei Bedarf unterstützen wir auch bei der Einrichtung eines neuen Kontos oder der Migration bestehender Kampagnen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Wie funktioniert die KI-basierte Optimierung bei Google Ads?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Unsere KI-gestützte Optimierung kombiniert Google's Machine Learning-Systeme mit unseren eigenen Algorithmen. Wir nutzen historische Daten, Branchentrends und Nutzerverhalten, um Gebote, Anzeigentexte und Targeting kontinuierlich zu optimieren. Während Google's Smart Bidding die Grundlage bildet, ergänzen unsere proprietären Modelle diese um individuelle Geschäftsziele und Saisonalitäten. Das Ergebnis sind präzisere Gebote, relevantere Anzeigen und ein besserer ROI als bei reinen Standard-Automatisierungen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Welche Vorteile bietet ein professionelles Google Ads Management gegenüber Eigenverwaltung?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Professionelles Google Ads Management bietet mehrere entscheidende Vorteile: Erstens verfügen spezialisierte Agenturen über jahrelange Erfahrung und Daten aus verschiedenen Branchen. Zweitens haben wir Zugang zu erweiterten Tools und Technologien, die für Einzelunternehmen oft nicht verfügbar oder rentabel sind. Drittens spart ein Experten-Team Zeit, die Sie in Ihr Kerngeschäft investieren können. Und nicht zuletzt: Unsere kontinuierliche Optimierung, A/B-Tests und strategische Planung führen nachweislich zu besseren Ergebnissen und höherem ROI als bei selbstverwalteten Kampagnen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Wie werden meine Kampagnen-Ergebnisse berichtet und gemessen?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Transparenz ist für uns entscheidend. Sie erhalten regelmäßige, maßgeschneiderte Reports mit allen relevanten KPIs und Vergleichen zur Vorperiode. Unser Dashboard ermöglicht Ihnen jederzeit Echtzeit-Einblick in Ihre Kampagnenleistung. Wir messen nicht nur oberflächliche Metriken wie Klicks und Impressionen, sondern konzentrieren uns auf geschäftsrelevante KPIs wie Conversions, Conversion-Kosten, Qualität der Leads und letztendlich den ROI. Alle Berichte werden mit Handlungsempfehlungen und Optimierungsvorschlägen ergänzt.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.8 }}
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 className="font-bold text-lg mb-2" itemProp="name">Was ist der Unterschied zwischen Google Ads und Google Analytics?</h3>
                <div itemScope itemType="https://schema.org/Answer">
                  <p className="text-gray-600" itemProp="text">
                    Google Ads und Google Analytics sind komplementäre Tools mit unterschiedlichen Funktionen: Google Ads ist die Plattform zur Erstellung und Verwaltung von bezahlten Suchanzeigen, während Google Analytics ein umfassendes Webanalyse-Tool ist, das das Besucherverhalten auf Ihrer Website verfolgt. Während Google Ads primär Daten zu Anzeigenleistung, Klicks und Kosten liefert, bietet Google Analytics tiefere Einblicke in das Nutzerverhalten nach dem Klick, wie Seitenaufrufe, Verweildauer und Conversion-Pfade. Die optimale Strategie verbindet beide Plattformen, um ein vollständiges Bild der Customer Journey zu erhalten.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Welches Budget benötige ich für Google Ads?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Das optimale Budget hängt von verschiedenen Faktoren ab, darunter Ihre Branche, Wettbewerbsdichte, geografischer Fokus und Geschäftsziele. Wir empfehlen für KMUs in der Regel ein Startbudget von mindestens 1.000€ monatlich, um aussagekräftige Daten zu sammeln und erste Erfolge zu erzielen. Nach einer initialen Testphase können wir gemeinsam das Budget skalieren oder anpassen."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Wie lange dauert es, bis Google Ads Ergebnisse zeigt?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Google Search Ads können unmittelbar nach Kampagnenstart erste Klicks und Conversions generieren. Für die vollständige Optimierung und das Erreichen der Ziel-KPIs sollten Sie jedoch mit einer Anlaufzeit von 2-3 Monaten rechnen. In dieser Zeit sammeln wir wertvolle Daten, testen verschiedene Ansätze und optimieren kontinuierlich für beste Performance."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Arbeiten Sie mit festen Verträgen oder monatlich kündbar?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wir bieten flexible Vertragsmodelle an, die auf Ihre Bedürfnisse zugeschnitten sind. Für langfristige Kooperationen empfehlen wir eine initiale Zusammenarbeit von mindestens 3-6 Monaten, um nachhaltigen Erfolg zu gewährleisten. Alle unsere Verträge haben jedoch eine monatliche Kündigungsfrist, da wir durch Qualität und Ergebnisse überzeugen möchten, nicht durch lange Vertragsbindungen."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Gehört mir das Google Ads Konto?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolut. Ihr Google Ads Konto gehört immer Ihnen. Wir arbeiten transparent als Agentur in Ihrem Konto und stellen sicher, dass Sie jederzeit vollen Zugriff und Einblick haben. Bei Bedarf unterstützen wir auch bei der Einrichtung eines neuen Kontos oder der Migration bestehender Kampagnen."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Wie funktioniert die KI-basierte Optimierung bei Google Ads?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unsere KI-gestützte Optimierung kombiniert Google's Machine Learning-Systeme mit unseren eigenen Algorithmen. Wir nutzen historische Daten, Branchentrends und Nutzerverhalten, um Gebote, Anzeigentexte und Targeting kontinuierlich zu optimieren. Während Google's Smart Bidding die Grundlage bildet, ergänzen unsere proprietären Modelle diese um individuelle Geschäftsziele und Saisonalitäten. Das Ergebnis sind präzisere Gebote, relevantere Anzeigen und ein besserer ROI als bei reinen Standard-Automatisierungen."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Welche Vorteile bietet ein professionelles Google Ads Management gegenüber Eigenverwaltung?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Professionelles Google Ads Management bietet mehrere entscheidende Vorteile: Erstens verfügen spezialisierte Agenturen über jahrelange Erfahrung und Daten aus verschiedenen Branchen. Zweitens haben wir Zugang zu erweiterten Tools und Technologien, die für Einzelunternehmen oft nicht verfügbar oder rentabel sind. Drittens spart ein Experten-Team Zeit, die Sie in Ihr Kerngeschäft investieren können. Und nicht zuletzt: Unsere kontinuierliche Optimierung, A/B-Tests und strategische Planung führen nachweislich zu besseren Ergebnissen und höherem ROI als bei selbstverwalteten Kampagnen."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Wie werden meine Kampagnen-Ergebnisse berichtet und gemessen?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Transparenz ist für uns entscheidend. Sie erhalten regelmäßige, maßgeschneiderte Reports mit allen relevanten KPIs und Vergleichen zur Vorperiode. Unser Dashboard ermöglicht Ihnen jederzeit Echtzeit-Einblick in Ihre Kampagnenleistung. Wir messen nicht nur oberflächliche Metriken wie Klicks und Impressionen, sondern konzentrieren uns auf geschäftsrelevante KPIs wie Conversions, Conversion-Kosten, Qualität der Leads und letztendlich den ROI. Alle Berichte werden mit Handlungsempfehlungen und Optimierungsvorschlägen ergänzt."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Was ist der Unterschied zwischen Google Ads und Google Analytics?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Google Ads und Google Analytics sind komplementäre Tools mit unterschiedlichen Funktionen: Google Ads ist die Plattform zur Erstellung und Verwaltung von bezahlten Suchanzeigen, während Google Analytics ein umfassendes Webanalyse-Tool ist, das das Besucherverhalten auf Ihrer Website verfolgt. Während Google Ads primär Daten zu Anzeigenleistung, Klicks und Kosten liefert, bietet Google Analytics tiefere Einblicke in das Nutzerverhalten nach dem Klick, wie Seitenaufrufe, Verweildauer und Conversion-Pfade. Die optimale Strategie verbindet beide Plattformen, um ein vollständiges Bild der Customer Journey zu erhalten."
                  }
                }
              ]
            })
          }}
        />
      </section>
    </div>
  );
} 