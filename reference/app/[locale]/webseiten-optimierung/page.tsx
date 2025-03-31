'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { WebseitenOptimierungHero } from '@/app/components/hero/WebseitenOptimierungHero';
import { 
  Zap, 
  Gauge, 
  Code, 
  Database, 
  LineChart, 
  BarChart3, 
  Globe,
  Shield,
  Timer,
  Smartphone,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const optimierungServices = [
  {
    title: "Core Web Vitals Optimierung",
    description: "Wir optimieren Ihre Website nach Google Core Web Vitals Standards. Schnellere Ladezeiten verbessern nicht nur das Nutzererlebnis, sondern auch Ihre Rankings in Suchmaschinen.",
    icon: <Gauge className="h-10 w-10" />,
    benefits: ["LCP Optimierung", "CLS Reduzierung", "FID Verbesserung"],
    image: "/images/webseiten-optimierung/core-web-vitals.jpg",
    color: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    title: "Code & Asset Optimierung",
    description: "Wir optimieren den Code Ihrer Website und reduzieren unnötige Ressourcen. Durch Minifizierung, Bildoptimierung und effizientes Caching verbessern wir die Ladezeiten erheblich.",
    icon: <Code className="h-10 w-10" />,
    benefits: ["Code-Optimierung", "Ressourcen-Minifizierung", "Bildkomprimierung"],
    image: "/images/webseiten-optimierung/code-optimization.jpg",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "Next-Gen Webtechnologien",
    description: "Wir implementieren fortschrittliche Webtechnologien wie HTTP/3, Serverless Functions und moderne Frameworks. So bleibt Ihre Website technologisch auf dem neuesten Stand.",
    icon: <Zap className="h-10 w-10" />,
    benefits: ["Moderne Frameworks", "HTTP/3 & QUIC", "Progressive Web Apps"],
    image: "/images/webseiten-optimierung/next-gen.jpg",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "CDN & Hosting Optimierung",
    description: "Wir optimieren Ihre Hosting-Umgebung und implementieren Content Delivery Networks. Dadurch wird Ihre Website weltweit schnell ausgeliefert und ist besser vor Ausfällen geschützt.",
    icon: <Globe className="h-10 w-10" />,
    benefits: ["Content Delivery Network", "Optimiertes Hosting", "Edge Computing"],
    image: "/images/webseiten-optimierung/cdn.jpg",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "Mobile Performance",
    description: "Wir optimieren die Leistung Ihrer Website speziell für mobile Geräte. Mit responsivem Design, optimierten Inhalten und Progressive Web App Technologien sorgen wir für ein exzellentes mobiles Nutzererlebnis.",
    icon: <Smartphone className="h-10 w-10" />,
    benefits: ["Mobile-First Optimierung", "PWA-Implementation", "Adaptive Loading"],
    image: "/images/webseiten-optimierung/mobile-performance.jpg",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    title: "Performance Monitoring",
    description: "Wir setzen auf kontinuierliches Monitoring und regelmäßige Optimierungen. So bleibt Ihre Website dauerhaft schnell und entspricht stets den aktuellen Anforderungen.",
    icon: <LineChart className="h-10 w-10" />,
    benefits: ["Real-User-Monitoring", "Performance-Tracking", "Kontinuierliche Optimierung"],
    image: "/images/webseiten-optimierung/monitoring.jpg",
    color: "bg-green-50 text-green-700 border-green-200"
  }
];

const performanceVorteile = [
  {
    title: "Bessere Suchrankings",
    icon: <Gauge className="h-8 w-8" />,
    description: "Google belohnt schnelle Websites mit besseren Rankings in den Suchergebnissen."
  },
  {
    title: "Höhere Conversion-Raten",
    icon: <BarChart3 className="h-8 w-8" />,
    description: "Schnellere Websites führen nachweislich zu höheren Conversion-Raten und mehr Umsatz."
  },
  {
    title: "Optimales Nutzererlebnis",
    icon: <Smartphone className="h-8 w-8" />,
    description: "Schnelle Ladezeiten und reaktionsschnelle Interaktionen sorgen für zufriedene Nutzer."
  },
  {
    title: "Geringere Absprungraten",
    icon: <Zap className="h-8 w-8" />,
    description: "Performante Websites reduzieren Absprungraten und erhöhen die Verweildauer."
  },
  {
    title: "Wettbewerbsvorteil",
    icon: <Globe className="h-8 w-8" />,
    description: "Setzen Sie sich mit einer überdurchschnittlich schnellen Website von Ihren Mitbewerbern ab."
  },
  {
    title: "Zukunftssicherheit",
    icon: <Shield className="h-8 w-8" />,
    description: "Moderne Technologien und optimierte Infrastruktur machen Ihre Website fit für die Zukunft."
  }
];

const processSteps = [
  {
    step: 1,
    title: "Performance-Audit",
    description: "Umfassende Analyse Ihrer Website mit spezialisierten Tools wie Lighthouse, WebPageTest und anderen. Wir identifizieren alle Performance-Schwachstellen und priorisieren die notwendigen Optimierungen.",
    color: "bg-teal-500"
  },
  {
    step: 2,
    title: "Optimierungsstrategie",
    description: "Erstellung eines maßgeschneiderten Performance-Optimierungsplans basierend auf den Analyseergebnissen. Wir definieren klare Optimierungsziele, Maßnahmen und Erfolgskennzahlen.",
    color: "bg-blue-500"
  },
  {
    step: 3,
    title: "Technische Implementierung",
    description: "Umsetzung der definierten Optimierungsmaßnahmen. Wir optimieren Code, Ressourcen, Infrastruktur und setzen moderne Webtechnologien ein, um die Performance signifikant zu verbessern.",
    color: "bg-purple-500"
  },
  {
    step: 4,
    title: "Monitoring-Setup",
    description: "Einrichtung eines kontinuierlichen Performance-Monitorings, um die Ergebnisse zu tracken und weitere Optimierungspotenziale zu identifizieren.",
    color: "bg-amber-500"
  },
  {
    step: 5,
    title: "Kontinuierliche Optimierung",
    description: "Regelmäßige Überprüfung und Anpassung der Optimierungsmaßnahmen. Wir sorgen dafür, dass Ihre Website auch langfristig auf höchstem Performance-Niveau bleibt.",
    color: "bg-green-500"
  }
];

export default function WebseitenOptimierungPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  return (
    <main className="min-h-screen">
      <WebseitenOptimierungHero />

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Website Performance Optimierung</h2>
          <p className="text-gray-600">
            Wir machen Ihre Website schneller und leistungsfähiger mit modernsten Technologien und 
            bewährten Optimierungsmethoden. Eine performante Website sorgt für zufriedene Nutzer und 
            bessere Rankings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {optimierungServices.map((service, index) => (
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
            <h2 className="text-3xl font-bold mb-6">Die Vorteile einer schnellen Website</h2>
            <p className="text-gray-600">
              Eine optimierte Website-Performance bringt entscheidende Vorteile für Ihr Unternehmen – 
              von besseren Rankings bis hin zu höheren Conversions und Umsätzen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {performanceVorteile.map((item, index) => (
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

      {/* Technologien Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-3 py-1 bg-purple-100 text-purple-800 border-purple-200">Technologien</Badge>
          <h2 className="text-3xl font-bold mb-6">Moderne Technologien für maximale Performance</h2>
          <p className="text-gray-600">
            Wir setzen auf zukunftssichere Technologien und bewährte Methoden, 
            um die Performance Ihrer Website auf das nächste Level zu heben.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 border border-blue-100">
            <h3 className="text-2xl font-bold mb-6 text-blue-800">Frontend-Optimierung</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Code className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Code-Splitting & Lazy Loading</h4>
                  <p className="text-gray-700">Optimale Ressourcenverteilung durch intelligentes Laden von Code-Fragmenten bei Bedarf.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Next-Generation Bildformate</h4>
                  <p className="text-gray-700">Verwendung moderner Bildformate wie WebP und AVIF für optimale Kompression bei höchster Qualität.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Gauge className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Critical CSS & Ressourcenpriorisierung</h4>
                  <p className="text-gray-700">Priorisierung kritischer Ressourcen für schnellere visuelle Darstellung und verbesserte Interaktivität.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-lg p-8 border border-green-100">
            <h3 className="text-2xl font-bold mb-6 text-green-800">Backend & Infrastruktur</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Database className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Caching-Strategien & CDN</h4>
                  <p className="text-gray-700">Implementierung fortschrittlicher Caching-Methoden und Content Delivery Networks für globale Performance.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">HTTP/3 & QUIC</h4>
                  <p className="text-gray-700">Nutzung der neuesten Netzwerkprotokolle für schnellere Verbindungen und optimierte Datenübertragung.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Serverless Architecture</h4>
                  <p className="text-gray-700">Einsatz skalierbarer serverloser Architekturen für maximale Performance bei optimaler Kosteneffizienz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Unser Prozess</Badge>
          <h2 className="text-3xl font-bold mb-6">So optimieren wir Ihre Website</h2>
          <p className="text-gray-600">
            Unser bewährter Optimierungsprozess sorgt für messbare Verbesserungen und nachhaltige Performance-Steigerungen.
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
            <h2 className="text-3xl font-bold mb-6">Messbare Erfolge durch Performance-Optimierung</h2>
            <p className="text-gray-600">
              Unsere Kunden erleben deutliche Verbesserungen in allen relevanten Performance-Metriken 
              und profitieren von signifikanten Geschäftserfolgen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-teal-600 mb-2">-72%</div>
              <p className="text-gray-600">Reduzierte Ladezeit</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">95+</div>
              <p className="text-gray-600">PageSpeed Score</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">+38%</div>
              <p className="text-gray-600">Conversion-Rate</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-amber-600 mb-2">-45%</div>
              <p className="text-gray-600">Absprungrate</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 text-center py-20">
        <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl py-16 px-4 md:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Bereit für eine schnellere Website?</h2>
            <p className="text-xl mb-8 text-teal-100">
              Lassen Sie uns Ihre Website analysieren und einen maßgeschneiderten Performance-Optimierungsplan erstellen, 
              der Ihre Online-Präsenz auf das nächste Level bringt.
            </p>
            <Link href={`/${locale}/kontakt`}>
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                Kostenlosen Performance-Check anfordern
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 