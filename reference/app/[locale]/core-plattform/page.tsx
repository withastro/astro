import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, LineChart, Zap, Database, Globe, RefreshCw } from 'lucide-react';
import { MetricGrid } from '@/app/components/MetricGrid';
import { Timeline } from '@/app/components/Timeline';
import { motion } from 'framer-motion';
import { Metadata } from 'next';

// Hardcoded metadata to avoid database dependency for initial development
export const metadata: Metadata = {
  title: 'CORE Plattform - Maßgeschneiderte Marketing Automatisierung | OnlineMarketingCORE',
  description: 'Entdecken Sie unsere maßgeschneiderte CORE Plattform für Marketing Automatisierung, vollständige Datenattribution und Customer Journey Tracking mit direkter Geschäftsdatenintegration.',
  keywords: 'Marketing Automatisierung, digitale transformation, cloud lösungen, dsgvo konform, conversion optimierung, digitale marketingberatung',
};

export default function CorePlatformPage({ params }: { params: { locale: string } }) {
  // Using hardcoded values instead of translations for initial development
  const timelineEvents = [
    { title: 'Datenerfassung', description: 'Automatisierte Sammlung von Nutzerdaten über alle Touchpoints', date: '1' },
    { title: 'Datenintegration', description: 'Verknüpfung von Marketingdaten mit Geschäftsdaten', date: '2' },
    { title: 'Analyse & Attribution', description: 'KI-gestützte Analyse und Multi-Touch-Attribution', date: '3' },
    { title: 'Automatisierung', description: 'Prozessautomatisierung basierend auf Nutzerverhalten und Geschäftsdaten', date: '4' }
  ];

  const metrics = [
    { title: 'Gesteigerte Effizienz', value: '+45%', description: 'Durch Prozessautomatisierung' },
    { title: 'Attribution', value: '100%', description: 'Vollständige Sichtbarkeit der Customer Journey' },
    { title: 'Kosten Reduktion', value: '-30%', description: 'Durch optimierte Marketing Campaigns' },
    { title: 'Conversion Rate', value: '+65%', description: 'Durch personalisierte Kundenerfahrungen' }
  ];

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 to-indigo-800 text-white min-h-[650px]">
        <div className="absolute inset-0 opacity-20">
          {/* Abstract background pattern */}
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-center"></div>
        </div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-600">Premium Enterprise Lösung</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                CORE Plattform: <span className="text-blue-300">Ihre Zentrale Marketing-Schaltstelle</span>
              </h1>
              <p className="text-lg mb-8 text-blue-100">
                Maßgeschneiderte Prozessautomatisierung, vollständige Datenattribution und Customer Journey Tracking mit direkter Integration Ihrer Geschäftsdaten.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-white text-blue-900 hover:bg-blue-50">
                  Demo anfragen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Mehr erfahren
                </Button>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="bg-gradient-to-br from-blue-800 to-indigo-600 p-8 rounded-xl shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <BarChart2 className="h-8 w-8 mb-2 text-blue-300" />
                    <h3 className="font-medium">Echtzeit Analytics</h3>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <Database className="h-8 w-8 mb-2 text-blue-300" />
                    <h3 className="font-medium">Datenintegration</h3>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <Zap className="h-8 w-8 mb-2 text-blue-300" />
                    <h3 className="font-medium">Automatisierung</h3>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <LineChart className="h-8 w-8 mb-2 text-blue-300" />
                    <h3 className="font-medium">Attribution</h3>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature Overview Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-blue-900">Maßgeschneiderte Marketing-Automatisierung</h2>
            <p className="text-lg text-gray-600">
              Die CORE Plattform ist eine Enterprise-Lösung, die speziell für Ihr Unternehmen entwickelt wird. 
              Sie verbindet alle Marketing-Kanäle und integriert sich nahtlos mit Ihren Geschäftsdaten.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature Card 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300">
              <div className="bg-blue-50 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Database className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-900">Vollständige Datenintegration</h3>
              <p className="text-gray-600">
                Verbinden Sie alle Datenquellen - von GA4 BigQuery Streams bis zu Ihren CRM- und ERP-Systemen - für ein vollständiges Bild der Customer Journey.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300">
              <div className="bg-blue-50 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <RefreshCw className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-900">Intelligente Automatisierung</h3>
              <p className="text-gray-600">
                Automatisieren Sie komplexe Marketing-Prozesse basierend auf Echtzeit-Daten und Nutzerverhalten über alle Kanäle hinweg.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300">
              <div className="bg-blue-50 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-900">Multi-Channel-Integration</h3>
              <p className="text-gray-600">
                Nahtlose Integration aller Online Marketing Kanäle - von Google Ads bis Social Media - in einer einzigen, benutzerfreundlichen Plattform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-blue-900">Die Macht der CORE Plattform</h2>
          <MetricGrid metrics={metrics} />
        </div>
      </section>

      {/* Customer Journey Flow */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4 text-center text-blue-900">Vom Datensammeln zur Automatisierung</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Die CORE Plattform begleitet den gesamten Prozess von der Datensammlung über die Attribution bis zur intelligenten Automatisierung.
          </p>
          
          <Timeline events={timelineEvents} />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Bereit für eine maßgeschneiderte CORE Plattform?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Sprechen Sie mit unseren Experten und erfahren Sie, wie wir eine speziell auf Ihre Bedürfnisse zugeschnittene Lösung entwickeln können.
          </p>
          <Button className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-3">
            Kostenlose Beratung vereinbaren
          </Button>
        </div>
      </section>
    </main>
  );
} 