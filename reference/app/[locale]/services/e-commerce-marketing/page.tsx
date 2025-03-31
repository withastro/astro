'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  BarChart,
  CreditCard,
  LineChart,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  Truck,
  Users
} from 'lucide-react';
import { EcommerceHero } from '@/app/components/hero/EcommerceHero';

const ecommerceServices = [
  {
    title: "Shop-Optimierung",
    description: "Umfassende Analyse und Optimierung Ihres Online-Shops für maximale Performance. Wir optimieren Produktseiten, Checkout-Prozesse und die gesamte Customer Journey.",
    icon: <ShoppingCart className="h-10 w-10" />,
    benefits: ["UX-Optimierung", "Conversion-Rate", "A/B-Testing"],
    image: "/images/ecommerce/shop-optimization.svg",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "SEO & Content",
    description: "Professionelle Suchmaschinenoptimierung speziell für E-Commerce. Von der technischen SEO bis zur Content-Strategie für Kategorien und Produktseiten.",
    icon: <Search className="h-10 w-10" />,
    benefits: ["Technische SEO", "Content-Strategie", "Keyword-Optimierung"],
    image: "/images/ecommerce/seo-content.svg",
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    title: "Performance Marketing",
    description: "Datengesteuerte Werbekampagnen für maximalen ROI. Google Shopping, Search Ads, Social Media Advertising und Amazon Marketing für mehr Umsatz.",
    icon: <TrendingUp className="h-10 w-10" />,
    benefits: ["Google Shopping", "Social Ads", "Amazon PPC"],
    image: "/images/ecommerce/performance.svg",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "Analytics & Tracking",
    description: "Präzises Tracking und umfassende Datenanalyse für fundierte Entscheidungen. Implementierung von E-Commerce Tracking, Enhanced E-Commerce und Custom Tracking.",
    icon: <BarChart className="h-10 w-10" />,
    benefits: ["E-Commerce Tracking", "Conversion-Analyse", "Attribution"],
    image: "/images/ecommerce/analytics.svg",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    title: "Automatisierung",
    description: "Intelligente Automatisierung von Marketing- und Verkaufsprozessen. Von E-Mail-Marketing-Automation bis zu personalisierten Produktempfehlungen.",
    icon: <Settings className="h-10 w-10" />,
    benefits: ["E-Mail-Automation", "Feed-Management", "Personalisierung"],
    image: "/images/ecommerce/automation.svg",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "Fulfillment-Optimierung",
    description: "Optimierung der gesamten Lieferkette für schnellere Lieferzeiten und höhere Kundenzufriedenheit. Integration von Logistik- und Versandprozessen.",
    icon: <Truck className="h-10 w-10" />,
    benefits: ["Versandoptimierung", "Retourenmanagement", "Lageroptimierung"],
    image: "/images/ecommerce/fulfillment.svg",
    color: "bg-red-50 text-red-700 border-red-200"
  }
];

const processSteps = [
  {
    step: 1,
    title: "Analyse & Strategie",
    description: "Umfassende Analyse Ihres Online-Shops, der Zielgruppe und des Wettbewerbs. Entwicklung einer maßgeschneiderten E-Commerce Marketing Strategie.",
    color: "bg-blue-500"
  },
  {
    step: 2,
    title: "Shop-Optimierung",
    description: "Technische und UX-Optimierung Ihres Shops für bessere Performance und höhere Conversion-Rates.",
    color: "bg-green-500"
  },
  {
    step: 3,
    title: "Marketing-Setup",
    description: "Implementierung von Tracking, Einrichtung von Werbekonten und Aufbau von Automatisierungen.",
    color: "bg-purple-500"
  },
  {
    step: 4,
    title: "Kampagnen & Content",
    description: "Launch von Marketing-Kampagnen und kontinuierliche Content-Optimierung für maximale Sichtbarkeit.",
    color: "bg-indigo-500"
  },
  {
    step: 5,
    title: "Monitoring & Optimierung",
    description: "Kontinuierliche Überwachung aller KPIs und datenbasierte Optimierung für stetiges Wachstum.",
    color: "bg-red-500"
  }
];

export default function EcommerceMarketingPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  return (
    <main className="min-h-screen">
      {/* Hero Section with Slider */}
      <EcommerceHero />

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20" id="services">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Unsere E-Commerce Marketing Services</h2>
          <p className="text-gray-600">
            Wir bieten ein vollständiges Spektrum an E-Commerce Marketing Dienstleistungen – 
            von der Shop-Optimierung über Performance Marketing bis hin zu Automatisierung und Analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ecommerceServices.map((service, index) => (
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

      {/* Process Steps */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Unser E-Commerce Marketing Prozess</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className={`h-2 ${step.color} mb-4`}></div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-2xl font-bold mb-2">
                    {step.step}. {step.title}
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Bereit, Ihren Online-Shop auf das nächste Level zu bringen?
          </h2>
          <Link href="/beratungstermin">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Kostenlose Beratung vereinbaren
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
} 