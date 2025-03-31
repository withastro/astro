'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Search, 
  BarChart, 
  Globe, 
  FileText, 
  PieChart, 
  TrendingUp, 
  Layers, 
  Code,
  FileSearch,
  ArrowRight,
  Link2,
  CheckCircle,
  Clock,
  DollarSign,
  StopCircle,
  ChevronDown
} from 'lucide-react';

const seoServices = [
  {
    title: "OnPage SEO",
    description: "Optimierung aller technischen und inhaltlichen Aspekte Ihrer Website. Wir verbessern Meta-Tags, Seitenstruktur, interne Verlinkung und Content-Qualität für bessere Suchmaschinen-Rankings.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <path d="M12 14H28M12 20H28M12 26H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="28" cy="26" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M30 28L33 31" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    benefits: ["Technisches SEO", "Content-Optimierung", "Meta-Tags"],
    image: "/images/suchmaschinenoptimierung/onpage.jpg",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "OffPage SEO",
    description: "Aufbau einer starken Backlink-Struktur durch hochwertige Verlinkungen von relevanten Websites. Wir steigern die Autorität Ihrer Domain und verbessern Ihre Platzierungen in den Suchergebnissen.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <path d="M16 20H24M24 20L20 16M24 20L20 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="10" y="14" width="8" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="22" y="14" width="8" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    benefits: ["Backlink-Aufbau", "Domain-Autorität", "Outreach"],
    image: "/images/suchmaschinenoptimierung/offpage.jpg",
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    title: "Keyword-Recherche",
    description: "Identifikation der relevantesten und erfolgversprechendsten Suchbegriffe für Ihr Geschäft. Wir analysieren Suchvolumen, Wettbewerb und User Intent, um die optimale Keyword-Strategie zu entwickeln.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="18" cy="18" r="7" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 23L29 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15 18H21M18 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    benefits: ["Wettbewerbsanalyse", "Long-Tail Keywords", "Search Intent"],
    image: "/images/suchmaschinenoptimierung/keywords.jpg",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "Content-SEO",
    description: "Erstellung und Optimierung von hochwertigem Content, der sowohl für Nutzer als auch für Suchmaschinen relevant ist. Wir liefern SEO-optimierte Texte, die informieren und konvertieren.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <rect x="12" y="10" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 16H24M16 20H24M16 24H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    benefits: ["SEO-Texterstellung", "Content-Strategie", "Blogging"],
    image: "/images/suchmaschinenoptimierung/content.jpg",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    title: "Local SEO",
    description: "Optimierung Ihrer lokalen Sichtbarkeit für standortbezogene Suchanfragen. Wir optimieren Ihr Google Business Profil und lokale Einträge für mehr Sichtbarkeit in Ihrer Region.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <path d="M20 32C20 32 28 25 28 19C28 14.5817 24.4183 11 20 11C15.5817 11 12 14.5817 12 19C12 25 20 32 20 32Z" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    benefits: ["Google Business Profile", "Lokale Einträge", "Standort-Optimierung"],
    image: "/images/suchmaschinenoptimierung/local.jpg",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "SEO Monitoring & Reporting",
    description: "Kontinuierliche Überwachung und Analyse Ihrer SEO-Performance. Wir liefern transparente Berichte zu Rankings, Traffic und Conversions und identifizieren weitere Optimierungspotenziale.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
        <path d="M10 28L16 22L20 26L26 20L30 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 12V28H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    benefits: ["Rank-Tracking", "Traffic-Analyse", "Konkurrenzbeobachtung"],
    image: "/images/suchmaschinenoptimierung/monitoring.jpg",
    color: "bg-green-50 text-green-700 border-green-200"
  }
];

const seoVorteile = [
  {
    title: "Nachhaltige Sichtbarkeit",
    icon: <Search className="h-8 w-8" />,
    description: "Langfristige Präsenz in den organischen Suchergebnissen ohne kontinuierliche Werbekosten."
  },
  {
    title: "Höhere Glaubwürdigkeit",
    icon: <TrendingUp className="h-8 w-8" />,
    description: "Organische Platzierungen schaffen Vertrauen und Glaubwürdigkeit bei potenziellen Kunden."
  },
  {
    title: "Qualifizierter Traffic",
    icon: <BarChart className="h-8 w-8" />,
    description: "Gezielte Besucher mit konkretem Interesse an Ihren Produkten oder Dienstleistungen."
  },
  {
    title: "Besseres Nutzererlebnis",
    icon: <Layers className="h-8 w-8" />,
    description: "SEO-Optimierungen verbessern gleichzeitig die User Experience Ihrer Website."
  },
  {
    title: "Messbare Ergebnisse",
    icon: <PieChart className="h-8 w-8" />,
    description: "Transparente Erfolgsmessung durch detaillierte Berichte und Analysen."
  },
  {
    title: "Wettbewerbsvorteil",
    icon: <TrendingUp className="h-8 w-8" />,
    description: "Positionierung vor Ihren Wettbewerbern in relevanten Suchanfragen."
  }
];

const processSteps = [
  {
    step: 1,
    title: "SEO-Audit & Analyse",
    description: "Umfassende Analyse Ihrer Website und des aktuellen SEO-Status. Wir identifizieren Stärken, Schwächen und Optimierungspotenziale in Bezug auf technisches SEO, Content und Backlinks.",
    color: "bg-blue-500"
  },
  {
    step: 2,
    title: "Keyword-Strategie",
    description: "Detaillierte Recherche und Auswahl der relevantesten Suchbegriffe für Ihr Geschäft. Wir analysieren Suchvolumen, Wettbewerb und User Intent, um die optimale Keyword-Strategie zu entwickeln.",
    color: "bg-pink-500"
  },
  {
    step: 3,
    title: "OnPage-Optimierung",
    description: "Umsetzung technischer Verbesserungen und Content-Optimierung. Wir optimieren Meta-Tags, Seitenstruktur, interne Verlinkung und Content-Qualität für bessere Rankings.",
    color: "bg-purple-500"
  },
  {
    step: 4,
    title: "OffPage-Strategie",
    description: "Aufbau einer starken Backlink-Struktur durch hochwertige Verlinkungen. Wir identifizieren relevante Link-Quellen und verbessern die Autorität Ihrer Domain.",
    color: "bg-indigo-500"
  },
  {
    step: 5,
    title: "Monitoring & Optimierung",
    description: "Kontinuierliche Überwachung und Anpassung der SEO-Maßnahmen. Wir analysieren die Ergebnisse, identifizieren neue Chancen und optimieren kontinuierlich weiter.",
    color: "bg-green-500"
  }
];

const testimonials = [
  {
    name: "Michael Schmidt",
    title: "CEO",
    company: "TechStart GmbH",
    content: "Durch die SEO-Optimierung konnten wir unsere organischen Besucherzahlen innerhalb von 6 Monaten verdoppeln. Ein hervorragendes Ergebnis!",
    avatar: (
      <svg className="w-12 h-12 text-blue-600" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="24" cy="19" r="8" fill="currentColor"/>
        <path d="M11 40C11 33.9249 16.1005 29 22.3876 29H25.6124C31.8995 29 37 33.9249 37 40" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
    stats: "+127% organischer Traffic"
  },
  {
    name: "Sarah Weber",
    title: "Marketing Direktorin",
    company: "Mode & Style",
    content: "Die transparente Zusammenarbeit und die messbaren Erfolge haben uns überzeugt. Unsere Keywords ranken jetzt auf den Top-Positionen.",
    avatar: (
      <svg className="w-12 h-12 text-pink-600" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="24" cy="19" r="8" fill="currentColor"/>
        <path d="M11 40C11 33.9249 16.1005 29 22.3876 29H25.6124C31.8995 29 37 33.9249 37 40" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
    stats: "Top 3 Rankings"
  },
  {
    name: "Thomas Müller",
    title: "Geschäftsführer",
    company: "Baumarkt Plus",
    content: "Professionelle SEO-Beratung und hervorragende Umsetzung. Wir sind sehr zufrieden mit den Ergebnissen und der kontinuierlichen Betreuung.",
    avatar: (
      <svg className="w-12 h-12 text-green-600" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="24" cy="19" r="8" fill="currentColor"/>
        <path d="M11 40C11 33.9249 16.1005 29 22.3876 29H25.6124C31.8995 29 37 33.9249 37 40" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
    stats: "+89% mehr Leads"
  },
  {
    name: "Julia Becker",
    title: "E-Commerce Managerin",
    company: "ShopMaster GmbH",
    content: "Die SEO-Strategie hat unseren Online-Shop komplett transformiert. Die Conversion-Rate ist deutlich gestiegen und wir erreichen jetzt genau unsere Zielgruppe.",
    avatar: (
      <svg className="w-12 h-12 text-purple-600" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="24" cy="19" r="8" fill="currentColor"/>
        <path d="M11 40C11 33.9249 16.1005 29 22.3876 29H25.6124C31.8995 29 37 33.9249 37 40" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
    stats: "+156% Conversion-Rate"
  },
  {
    name: "Andreas Klein",
    title: "Head of Digital",
    company: "InnoTech Solutions",
    content: "Beeindruckende technische Expertise und innovative Lösungsansätze. Die automatisierten SEO-Prozesse sparen uns viel Zeit und bringen messbare Resultate.",
    avatar: (
      <svg className="w-12 h-12 text-indigo-600" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="24" cy="19" r="8" fill="currentColor"/>
        <path d="M11 40C11 33.9249 16.1005 29 22.3876 29H25.6124C31.8995 29 37 33.9249 37 40" stroke="currentColor" strokeWidth="3"/>
      </svg>
    ),
    stats: "43% mehr Umsatz"
  }
];

const faqItems = [
  {
    question: "Wie lange dauert es, bis SEO-Maßnahmen Wirkung zeigen?",
    answer: "SEO ist eine langfristige Strategie. Erste Verbesserungen sind oft nach 3-6 Monaten sichtbar, signifikante Ergebnisse zeigen sich typischerweise nach 6-12 Monaten. Dies hängt von verschiedenen Faktoren ab, wie Wettbewerb, Ausgangssituation und Umfang der Maßnahmen."
  },
  {
    question: "Was kostet professionelles SEO?",
    answer: "Die Kosten für SEO variieren je nach Projektumfang, Wettbewerbsintensität und Zielen. Wir erstellen Ihnen ein individuelles Angebot basierend auf Ihrer spezifischen Situation. Typische SEO-Projekte beginnen bei 1.500€ monatlich."
  },
  {
    question: "Welche SEO-Maßnahmen sind die wichtigsten?",
    answer: "Die wichtigsten SEO-Maßnahmen umfassen technische Optimierung, hochwertige Content-Erstellung, Keyword-Optimierung und den Aufbau relevanter Backlinks. Die genaue Priorisierung hängt von Ihrer individuellen Situation ab."
  },
  {
    question: "Garantieren Sie Top-Rankings bei Google?",
    answer: "Nein, seriöse SEO-Agenturen geben keine Ranking-Garantien. Google's Algorithmen sind komplex und ändern sich ständig. Wir garantieren jedoch professionelle Arbeit nach aktuellen SEO-Best-Practices und volle Transparenz."
  },
  {
    question: "Wie unterscheidet sich SEO von Google Ads?",
    answer: "SEO zielt auf organische (unbezahlte) Suchergebnisse ab und bietet langfristige, nachhaltige Ergebnisse. Google Ads hingegen sind bezahlte Anzeigen, die sofort Sichtbarkeit bringen, aber nur solange aktiv sind, wie Sie dafür bezahlen. Eine optimale Strategie kombiniert oft beide Ansätze."
  },
  {
    question: "Wie wichtig ist Content für SEO?",
    answer: "Content ist einer der wichtigsten SEO-Faktoren. Hochwertiger, relevanter Content hilft nicht nur bei Rankings, sondern sorgt auch für bessere User-Signale, längere Verweildauer und höhere Conversion-Raten. Wir entwickeln maßgeschneiderte Content-Strategien basierend auf Ihrer Zielgruppe."
  },
  {
    question: "Was ist der Unterschied zwischen OnPage und OffPage SEO?",
    answer: "OnPage SEO umfasst alle Optimierungen auf Ihrer Website selbst, wie technische Aspekte, Content und interne Verlinkung. OffPage SEO bezieht sich auf externe Faktoren wie Backlinks und Markenpräsenz im Web. Beide Bereiche sind wichtig für eine erfolgreiche SEO-Strategie."
  },
  {
    question: "Wie oft aktualisieren Sie Ihre SEO-Strategien?",
    answer: "Wir überprüfen und aktualisieren unsere SEO-Strategien kontinuierlich. Google führt jährlich über 500 Algorithmus-Updates durch. Unser Team verfolgt alle relevanten Änderungen und passt die Strategien entsprechend an, um optimale Ergebnisse zu gewährleisten."
  },
  {
    question: "Welche Tools und Technologien nutzen Sie für SEO?",
    answer: "Wir setzen auf eine Kombination aus führenden SEO-Tools wie Ahrefs, SEMrush, Screaming Frog und Google Search Console. Zusätzlich nutzen wir eigene, KI-gestützte Analysetools für tiefgehende Insights und Optimierungspotenziale."
  },
  {
    question: "Wie messen Sie den SEO-Erfolg?",
    answer: "Wir messen den Erfolg anhand verschiedener KPIs wie Rankings, organischer Traffic, Conversion-Rate, Sichtbarkeitsindex und ROI. Sie erhalten regelmäßige, detaillierte Berichte mit allen relevanten Metriken und konkreten Handlungsempfehlungen."
  }
];

const seoStats = [
  {
    value: "93",
    suffix: "%",
    label: "aller Online-Erlebnisse beginnen mit einer Suchmaschine"
  },
  {
    value: "75",
    suffix: "%",
    label: "der Nutzer scrollen nie weiter als Seite 1 der Suchergebnisse"
  },
  {
    value: "14.3",
    suffix: "x",
    label: "höhere Conversion-Rate durch SEO vs. traditionelle Outbound-Methoden"
  },
  {
    value: "67",
    suffix: "%",
    label: "aller Klicks gehen an die ersten 5 organischen Suchergebnisse"
  }
];

export default function SuchmaschinenoptimierungPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  // FAQ Structured Data
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <main className="min-h-screen">
      <Script
        id="faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-950 to-blue-800 text-white py-20 md:py-32">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="absolute h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="search-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#search-grid)"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <Badge className="mb-4 px-3 py-1 self-start bg-white/20 border-white/30 text-white backdrop-blur-sm">
                Suchmaschinenoptimierung
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  Mehr Sichtbarkeit
                </span>
                <span> durch professionelles SEO</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8">
                Steigern Sie Ihre Positionen in Google & Co. durch unsere ganzheitliche 
                Suchmaschinenoptimierung und erreichen Sie nachhaltig mehr qualifizierte Besucher.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900">
                  Kostenlose SEO-Analyse anfordern
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                  Mehr erfahren
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="relative bg-white/10 backdrop-blur-xl p-6 lg:p-8 rounded-2xl border border-white/20 shadow-2xl">
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
                  
                  <div className="w-full max-w-sm space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-3">
                        <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 w-full bg-white/10 rounded mb-1"></div>
                        <div className="h-3 w-2/3 bg-white/10 rounded"></div>
                        <div className="flex items-center mt-2">
                          <div className="h-3 w-20 bg-white/20 rounded"></div>
                          <div className="h-3 w-3 bg-blue-400 rounded-full ml-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Unsere SEO Services</h2>
          <p className="text-gray-600">
            Wir bieten umfassende Suchmaschinenoptimierung für nachhaltig bessere Rankings, 
            mehr Traffic und höhere Conversion-Raten.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {seoServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                    {service.icon}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold">{service.title}</h3>
                  </div>
                </div>
                
                <CardContent className="pt-6 flex-grow">
                  <p className="text-gray-700 mb-6">{service.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {service.benefits.map((benefit, idx) => (
                      <Badge key={idx} variant="secondary" className={service.color}>
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Vorteile</Badge>
            <h2 className="text-3xl font-bold mb-6">Die Vorteile professioneller Suchmaschinenoptimierung</h2>
            <p className="text-gray-600">
              Eine durchdachte SEO-Strategie bringt entscheidende Vorteile für Ihr Unternehmen und 
              sorgt für nachhaltige Online-Sichtbarkeit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seoVorteile.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Unser Prozess</Badge>
          <h2 className="text-3xl font-bold mb-6">Unsere SEO-Methodik</h2>
          <p className="text-gray-600">
            Unser bewährter SEO-Prozess sorgt für messbare Erfolge und nachhaltige Verbesserungen 
            Ihrer Sichtbarkeit in Suchmaschinen.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex mb-8 last:mb-0"
            >
              <div className="mr-6 flex flex-col items-center">
                <div className={`${step.color} text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg`}>
                  {step.step}
                </div>
                {index < processSteps.length - 1 && (
                  <div className="w-0.5 bg-gray-200 grow mt-2"></div>
                )}
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm flex-1">
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Results Section */}
      <section className="bg-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Ergebnisse</Badge>
            <h2 className="text-3xl font-bold mb-6">Messbare Erfolge durch SEO</h2>
            <p className="text-gray-600">
              Unsere Kunden erleben mit unseren SEO-Maßnahmen deutliche Verbesserungen 
              in allen relevanten Metriken.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">+187%</div>
              <p className="text-gray-600">Organischer Traffic</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-pink-600 mb-2">Top 3</div>
              <p className="text-gray-600">Google-Rankings</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">+95%</div>
              <p className="text-gray-600">Qualifizierte Leads</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-indigo-600 mb-2">+210%</div>
              <p className="text-gray-600">ROI</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 text-center py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl py-16 px-4 md:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Bereit für bessere Rankings?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Lassen Sie uns Ihre Website analysieren und einen maßgeschneiderten SEO-Plan erstellen, 
              der Ihre Sichtbarkeit in Suchmaschinen nachhaltig verbessert.
            </p>
            <Link href={`/${locale}/kontakt`}>
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Kostenlose SEO-Analyse anfordern
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {seoStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl bg-white shadow-lg"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                  <span className="text-blue-500">{stat.suffix}</span>
                </div>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO vs. Paid Comparison */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">SEO vs. Bezahlte Werbung</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-8 rounded-xl">
              <h3 className="text-xl font-semibold text-blue-700 mb-4">Suchmaschinenoptimierung (SEO)</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                  <span>Nachhaltige Ergebnisse ohne laufende Werbekosten</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                  <span>Höhere Glaubwürdigkeit durch organische Rankings</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                  <span>Langfristige Steigerung des Domain-Wertes</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Bezahlte Werbung</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Clock className="h-6 w-6 text-gray-600 mr-2 flex-shrink-0" />
                  <span>Sofortige Sichtbarkeit, aber kontinuierliche Kosten</span>
                </li>
                <li className="flex items-start">
                  <DollarSign className="h-6 w-6 text-gray-600 mr-2 flex-shrink-0" />
                  <span>Werbecharakter kann Vertrauen mindern</span>
                </li>
                <li className="flex items-start">
                  <StopCircle className="h-6 w-6 text-gray-600 mr-2 flex-shrink-0" />
                  <span>Traffic stoppt sofort bei Kampagnenende</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Das sagen unsere Kunden</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{testimonial.content}</p>
                <div className="text-blue-600 font-semibold">{testimonial.stats}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Häufig gestellte Fragen</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-semibold">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 transform transition-transform ${
                      activeAccordion === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all ${
                    activeAccordion === index ? 'max-h-96 py-4' : 'max-h-0'
                  }`}
                >
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
} 