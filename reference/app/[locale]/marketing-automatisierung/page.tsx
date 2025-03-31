'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  GlobeAltIcon, 
  ChartBarIcon, 
  CogIcon, 
  LightBulbIcon,
  ShieldCheckIcon,
  ArrowLongRightIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ArrowsPointingOutIcon,
  ArrowTrendingUpIcon,
  ListBulletIcon,
  MapPinIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  ClockIcon,
  CubeTransparentIcon,
  FingerPrintIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function MarketingAutomationPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('workflows');
  
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="pt-12 pb-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">
                Marketing Automatisierung
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Automatisieren Sie Ihr Marketing für <span className="text-orange-600">bessere Ergebnisse</span> in weniger Zeit
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Maßgeschneiderte DSGVO-konforme Automatisierungslösungen, die Ihre Prozesse optimieren, 
                Ihre Konversionen steigern und Ihnen wertvolle Zeit zurückgeben.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Kostenlose Beratung vereinbaren
                  <ArrowLongRightIcon className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  Erfolgsbeispiele ansehen
                </Button>
              </div>
              
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-orange-600">+68%</div>
                  <p className="text-sm text-gray-500">Höhere Conversion-Rate</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">-42%</div>
                  <p className="text-sm text-gray-500">Weniger Zeitaufwand</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">+127%</div>
                  <p className="text-sm text-gray-500">Mehr qualifizierte Leads</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute top-24 right-20 w-20 h-20 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <Image
                  src="/images/marketing-automation-hero.jpg"
                  alt="Marketing Automatisierung mit OnlineMarketingCORE"
                  width={600}
                  height={500}
                  className="w-full h-auto"
                />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <div className="flex items-center gap-3 text-white">
                    <ShieldCheckIcon className="h-5 w-5 text-orange-300" />
                    <span className="text-sm font-medium">100% DSGVO-konforme Automatisierung</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-5 -bottom-5 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <CodeBracketIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Technische Expertise</p>
                    <p className="text-xs text-gray-500">Eigenes IT-Team & Entwickler</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Service Overview Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">
              Marketing Automation Expertise
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Die Zukunft des Marketings ist automatisiert
            </h2>
            <p className="text-xl text-gray-600">
              Mit über 25 Jahren Erfahrung an der Schnittstelle von Marketing und Technologie 
              bieten wir innovative Automatisierungslösungen, die messbare Ergebnisse liefern.
            </p>
          </div>
          
          <div className="mb-20 max-w-4xl mx-auto">
            <p className="text-gray-600 mb-8 text-lg">
              Als erfahrene Marketing-Automatisierungsagentur mit eigener IT-Abteilung bieten wir maßgeschneiderte Lösungen, 
              die weit über das hinausgehen, was andere Agenturen leisten können. Wir verbinden tiefes technisches Know-how mit 
              strategischem Marketingverständnis, um Prozesse zu optimieren, die Effizienz zu steigern und nachhaltige Ergebnisse zu erzielen.
            </p>
            <p className="text-gray-600 mb-8 text-lg">
              Unser Ansatz basiert auf einer umfassenden Analyse Ihrer aktuellen Marketingprozesse, der Identifizierung von 
              Automatisierungspotenzialen und der Implementierung maßgeschneiderter Lösungen, die perfekt auf Ihre Geschäftsziele abgestimmt sind. 
              Dabei legen wir besonderen Wert auf DSGVO-Konformität und Datensicherheit.
            </p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-all border-orange-100">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center mb-4">
                    <BoltIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Effizienz durch Automatisierung</CardTitle>
                  <CardDescription className="text-gray-600">
                    Sparen Sie bis zu 32 Stunden pro Woche durch intelligente Automatisierung wiederkehrender Marketing-Aufgaben.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Automatisierte Lead-Nurturing-Prozesse</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Zeitsparende Workflow-Automatisierung</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Reduzierung manueller Fehlerquellen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-all border-orange-100">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center mb-4">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Personalisierte Kundenerlebnisse</CardTitle>
                  <CardDescription className="text-gray-600">
                    Schaffen Sie maßgeschneiderte Customer Journeys, die auf individuelle Bedürfnisse und Verhaltensweisen eingehen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Verhaltensbasiertes Marketing</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Dynamische Inhaltsanpassung</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Gezielte Kommunikation zum richtigen Zeitpunkt</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-all border-orange-100">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center mb-4">
                    <ChartBarIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Messbarer Marketing-ROI</CardTitle>
                  <CardDescription className="text-gray-600">
                    Tracken und optimieren Sie Ihre Kampagnen in Echtzeit für maximale Rentabilität Ihrer Marketinginvestitionen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Transparente Performance-Messung</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Automatisierte Reports und Dashboards</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm">Datengetriebene Optimierung</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Automation Services Section with Tabs */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-4 px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">
              Unsere Automatisierungslösungen
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Umfassende Automatisierungsdienste für jeden Bereich Ihres Marketings
            </h2>
            <p className="text-gray-600 text-lg">
              Wir bieten maßgeschneiderte Automatisierungslösungen, die perfekt auf Ihre Unternehmensziele, 
              Branche und Zielgruppe abgestimmt sind.
            </p>
          </div>
          
          <Tabs 
            defaultValue="workflows" 
            className="max-w-5xl mx-auto" 
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
              <TabsTrigger value="workflows" className="text-sm md:text-base">
                Marketing Workflows
              </TabsTrigger>
              <TabsTrigger value="personalization" className="text-sm md:text-base">
                Personalisierung
              </TabsTrigger>
              <TabsTrigger value="crm" className="text-sm md:text-base">
                CRM Integration
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm md:text-base">
                Analytics & Reporting
              </TabsTrigger>
            </TabsList>
            
            {/* Marketing Workflows Tab */}
            <TabsContent value="workflows" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Marketing Workflow Automatisierung</h3>
                  <p className="text-gray-600 mb-6">
                    Automatisieren Sie komplexe Marketing-Prozesse und -Abläufe, um Zeit zu sparen, Fehler zu reduzieren und konsistente Ergebnisse zu erzielen.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Email-Marketing-Automation</h4>
                        <p className="text-sm text-gray-600">Automatisierte E-Mail-Sequenzen, Trigger-basierte Kampagnen und personalisierte Kommunikation.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Lead Nurturing</h4>
                        <p className="text-sm text-gray-600">Automatisierte Lead-Qualifizierung und Pflege durch relevante Inhalte in jeder Phase der Customer Journey.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Social Media Automatisierung</h4>
                        <p className="text-sm text-gray-600">Geplante Posts, automatische Republishing-Strategien und Content-Recycling für alle Kanäle.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Campaign Orchestration</h4>
                        <p className="text-sm text-gray-600">Kanalübergreifende Kampagnensteuerung mit automatisierten Abläufen und Triggern.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-8 h-full flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold mb-2">Workflow-Analyse</h4>
                    <p className="text-gray-600">
                      Unsere detaillierte Workflow-Analyse identifiziert Automatisierungspotenziale und entwickelt einen strategischen Plan zur Optimierung Ihrer Marketingprozesse.
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Prozessanalyse & Optimierung</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Identifikation von Automatisierungspotentialen</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Implementierungsplanung</span>
                    </li>
                  </ul>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                    Workflow-Analyse anfordern
                    <ArrowLongRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Personalization Tab */}
            <TabsContent value="personalization" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Personalisierung & Customer Experience</h3>
                  <p className="text-gray-600 mb-6">
                    Schaffen Sie individuelle Kundenerlebnisse durch maßgeschneiderte Inhalte und verhaltensbasierte Kommunikation.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Dynamische Website-Personalisierung</h4>
                        <p className="text-sm text-gray-600">Automatische Anpassung von Website-Inhalten basierend auf Benutzerverhalten und -präferenzen.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Verhaltensbasierte Trigger</h4>
                        <p className="text-sm text-gray-600">Automatische Reaktionen auf Nutzerverhalten wie Warenkorbabbrüche, Seitenbesuche oder Inaktivität.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Customer Journey Mapping</h4>
                        <p className="text-sm text-gray-600">Entwicklung und Automatisierung personalisierter Customer Journeys für verschiedene Zielgruppen.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Automatisierte Produktempfehlungen</h4>
                        <p className="text-sm text-gray-600">KI-gestützte Produkt- und Content-Empfehlungen basierend auf Nutzerverhalten und Präferenzen.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-8 h-full flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold mb-2">Personalisierungs-Audit</h4>
                    <p className="text-gray-600">
                      Unser Personalisierungs-Audit analysiert Ihre bestehenden Kundenkontaktpunkte und identifiziert Potenziale für eine effektivere personalisierte Kommunikation.
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Analyse der Customer Journey</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Segmentierungsstrategie</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Personalisierungskonzept</span>
                    </li>
                  </ul>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                    Personalisierungs-Audit anfordern
                    <ArrowLongRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* CRM Integration Tab */}
            <TabsContent value="crm" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4">CRM & Systeme Integration</h3>
                  <p className="text-gray-600 mb-6">
                    Verbinden Sie Ihre Marketing-Automatisierungsplattform nahtlos mit Ihrem CRM-System und anderen Geschäftsanwendungen.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">CRM-Synchronisation</h4>
                        <p className="text-sm text-gray-600">Bidirektionale Synchronisation zwischen Marketing-Automation und CRM für einheitliche Kundendaten.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">API-Entwicklung & -Integration</h4>
                        <p className="text-sm text-gray-600">Maßgeschneiderte API-Lösungen für die nahtlose Verbindung aller Ihrer Marketing- und Geschäftssysteme.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Datenmigrationen & -konsolidierung</h4>
                        <p className="text-sm text-gray-600">Strukturierte Überführung und Vereinheitlichung von Daten aus verschiedenen Quellen.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Middleware-Entwicklung</h4>
                        <p className="text-sm text-gray-600">Entwicklung von Schnittstellen-Lösungen für nicht-kompatible Systeme und Legacy-Anwendungen.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-8 h-full flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold mb-2">Systemintegrations-Analyse</h4>
                    <p className="text-gray-600">
                      Unsere technische Analyse bewertet Ihre bestehende Systemlandschaft und entwickelt einen strukturierten Integrationsplan für optimale Datenflüsse.
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>System- & Datenfluss-Analyse</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Technische Machbarkeitsstudie</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Integrations-Roadmap</span>
                    </li>
                  </ul>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                    Integrations-Analyse anfordern
                    <ArrowLongRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Analytics & Reporting Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Analytics & Automatisiertes Reporting</h3>
                  <p className="text-gray-600 mb-6">
                    Erfassen, analysieren und visualisieren Sie Ihre Marketingdaten automatisch für datengetriebene Entscheidungen.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Automatisierte Dashboards</h4>
                        <p className="text-sm text-gray-600">Maßgeschneiderte Live-Dashboards mit automatischer Datenaktualisierung für alle wichtigen KPIs.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Anomalie-Erkennung</h4>
                        <p className="text-sm text-gray-600">KI-gestützte Erkennung von Abweichungen und automatische Benachrichtigungen bei signifikanten Veränderungen.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Attribution & ROI-Tracking</h4>
                        <p className="text-sm text-gray-600">Automatische Zuordnung von Conversions zu Marketingaktivitäten und kontinuierliche ROI-Berechnung.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full text-orange-700 flex items-center justify-center mt-0.5">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold">Automatisierte Reports</h4>
                        <p className="text-sm text-gray-600">Terminierte Versendung von individualisierten Reports an verschiedene Stakeholder.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-8 h-full flex flex-col justify-between">
                  <div className="mb-6">
                    <h4 className="text-xl font-semibold mb-2">Analytics-Setup</h4>
                    <p className="text-gray-600">
                      Unser Analytics-Setup etabliert eine solide Datenbasis für Ihre Marketing-Automatisierung und stellt sicher, dass alle relevanten Daten erfasst und ausgewertet werden.
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>KPI-Definition & Tracking-Setup</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Datenqualitätsprüfung</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span>Dashboard-Konfiguration</span>
                    </li>
                  </ul>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                    Analytics-Setup anfordern
                    <ArrowLongRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Educational Section: Why Marketing Automation Matters */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">Wissenswertes</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Warum Marketing Automatisierung wichtig ist
            </h2>
            <p className="text-gray-600 text-lg">
              Die Digitalisierung hat das Marketing grundlegend verändert. Marketing Automatisierung
              ist heute ein unverzichtbarer Wachstumsfaktor für jedes moderne Unternehmen.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div 
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <motion.div variants={itemVariants} className="flex gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-orange-100 rounded-lg text-orange-800 flex items-center justify-center">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Effizienzsteigerung & Zeitersparnis</h3>
                    <p className="text-gray-600">
                      Marketingteams verbringen durchschnittlich 70% ihrer Zeit mit manuellen, repetitiven Aufgaben. 
                      Durch Automatisierung können bis zu 80% dieser Aufgaben automatisiert werden, was zu einer 
                      erheblichen Zeitersparnis führt und es Teams ermöglicht, sich auf strategische Aktivitäten zu konzentrieren.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-orange-100 rounded-lg text-orange-800 flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Personalisierung im Maßstab</h3>
                    <p className="text-gray-600">
                      Personalisierte Marketing-Kommunikation führt zu 29% höheren Konversionsraten. 
                      Ohne Automatisierung ist Personalisierung in großem Maßstab jedoch unmöglich. 
                      Marketing Automation ermöglicht individualisierte Interaktionen mit tausenden von Kunden gleichzeitig.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-orange-100 rounded-lg text-orange-800 flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Messbare Ergebnisse & höherer ROI</h3>
                    <p className="text-gray-600">
                      Unternehmen, die Marketing-Automatisierung nutzen, berichten von einem um 14,5% höheren Umsatzwachstum 
                      und einer 12,2% Reduktion der Marketingkosten. Automatisierung ermöglicht präzise Messung und kontinuierliche 
                      Optimierung aller Marketingaktivitäten.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-orange-100 rounded-lg text-orange-800 flex items-center justify-center">
                    <FingerPrintIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Konsistente Kundenerfahrung</h3>
                    <p className="text-gray-600">
                      Automatisierte Marketing-Prozesse sorgen für eine einheitliche und fehlerfreie Kundenkommunikation 
                      über alle Kanäle hinweg. Dies führt zu einer 33% höheren Kundenzufriedenheit und einer 23% 
                      höheren Kundenbindungsrate.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            
            <div>
              <div className="relative">
                <div className="aspect-square relative rounded-2xl overflow-hidden shadow-xl mb-8">
                  <Image
                    src="/images/marketing-automation-benefits.jpg"
                    alt="Marketing Automation Benefits"
                    width={600}
                    height={600}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <Badge className="mb-2 bg-orange-500/80 text-white border-orange-400/20 backdrop-blur-sm">
                      <span className="text-lg font-bold">+44%</span>
                    </Badge>
                    <p className="text-white text-sm">Durchschnittliche ROI-Steigerung im ersten Jahr</p>
                  </div>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <LightBulbIcon className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-800">Wussten Sie schon?</AlertTitle>
                  <AlertDescription className="text-gray-600">
                    Laut einer Studie von Nucleus Research liefert jeder in Marketing-Automatisierung investierte Euro durchschnittlich 
                    einen ROI von 8,73 €, was sie zu einer der rentabelsten Marketinginvestitionen macht.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Educational Section: Automation Best Practices */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">Best Practices</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Marketing Automatisierung Best Practices</h2>
            <p className="text-gray-600 text-lg">
              Erfolgreiche Marketing-Automatisierung basiert auf bewährten Strategien und Prinzipien. 
              Hier sind die wichtigsten Best Practices für nachhaltige Ergebnisse.
            </p>
          </div>
          
          <Tabs defaultValue="strategy" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
              <TabsTrigger value="strategy">Strategie & Planung</TabsTrigger>
              <TabsTrigger value="data">Daten & Integration</TabsTrigger>
              <TabsTrigger value="content">Content & Personalisierung</TabsTrigger>
              <TabsTrigger value="optimization">Messung & Optimierung</TabsTrigger>
            </TabsList>
            
            <TabsContent value="strategy">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center">
                        <PresentationChartLineIcon className="h-4 w-4" />
                      </div>
                      <span>Beginnen Sie mit einer klaren Strategie</span>
                    </CardTitle>
                    <CardDescription>
                      Eine erfolgreiche Automatisierung beginnt mit klar definierten Zielen und Strategien
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Bevor Sie mit der Implementierung von Automatisierungslösungen beginnen, definieren Sie konkrete Ziele 
                      (z.B. Lead-Generierung steigern, Conversion-Rate erhöhen) und entwickeln Sie eine strukturierte Strategie.
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Definieren Sie messbare KPIs für jede automatisierte Kampagne</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Priorisieren Sie Automatisierungsprojekte nach ROI-Potenzial</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Erstellen Sie eine Roadmap mit klaren Meilensteinen</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4" />
                      </div>
                      <span>Entwickeln Sie detaillierte Kundensegmente</span>
                    </CardTitle>
                    <CardDescription>
                      Zielgerichtete Automatisierung erfordert präzise Kundensegmente und Personas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Je präziser Ihre Kundensegmentierung, desto effektiver wird Ihre Marketing-Automatisierung sein. 
                      Erstellen Sie detaillierte Segmente basierend auf demografischen Daten, Verhalten und Präferenzen.
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Definieren Sie granulare Segmente basierend auf Verhaltensdaten</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Segmentieren Sie nach Position im Sales Funnel</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Aktualisieren Sie Segmente dynamisch basierend auf Interaktionen</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center">
                        <MapPinIcon className="h-4 w-4" />
                      </div>
                      <span>Erstellen Sie umfassende Customer Journeys</span>
                    </CardTitle>
                    <CardDescription>
                      Durchdachte Customer Journeys sind das Fundament erfolgreicher Automatisierung
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Skizzieren Sie detaillierte Customer Journeys, die den gesamten Kundenpfad vom ersten Kontakt 
                      bis zur Conversion und darüber hinaus abbilden. Diese Journeys dienen als Blaupause für Ihre 
                      Automatisierungsworkflows.
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Identifizieren Sie alle relevanten Touchpoints und Mikro-Conversions</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Planen Sie alternative Pfade basierend auf unterschiedlichen Nutzerreaktionen</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Optimieren Sie für nahtlose Übergänge zwischen Marketing und Vertrieb</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center">
                        <CogIcon className="h-4 w-4" />
                      </div>
                      <span>Beginnen Sie klein und skalieren Sie</span>
                    </CardTitle>
                    <CardDescription>
                      Erfolgreiche Automatisierung entwickelt sich schrittweise und wird kontinuierlich verbessert
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Starten Sie mit einem überschaubaren Automatisierungsprojekt, gewinnen Sie Erfahrung und 
                      erweitern Sie Ihre Automatisierung schrittweise. Dieser iterative Ansatz minimiert Risiken und maximiert 
                      die Erfolgschancen.
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Implementieren Sie zunächst einfache, schnell umzusetzende Workflows</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Testen Sie gründlich, bevor Sie komplexere Szenarien automatisieren</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Schulen Sie Ihr Team kontinuierlich zu Best Practices</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-start gap-3">
                  <LightBulbIcon className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-orange-800">Experten-Tipp:</h4>
                    <p className="text-gray-600">
                      Erstellen Sie vor der Implementierung einer Automatisierungsstrategie eine detaillierte 
                      Bestandsaufnahme Ihrer bestehenden Marketingprozesse. Identifizieren Sie manuelle Prozesse, 
                      die viel Zeit in Anspruch nehmen, fehleranfällig sind oder bei Skalierung Schwierigkeiten 
                      bereiten – diese bieten in der Regel das größte Automatisierungspotenzial.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg text-orange-700 flex items-center justify-center">
                        <CodeBracketIcon className="h-4 w-4" />
                      </div>
                      <span>Sorgen Sie für saubere Datenintegration</span>
                    </CardTitle>
                    <CardDescription>
                      Qualitativ hochwertige, integrierte Daten sind die Grundlage erfolgreicher Automatisierung
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Stellen Sie sicher, dass Ihre Automatisierungsplattform nahtlos mit allen relevanten Datenquellen 
                      verbunden ist und konsistente Daten über alle Systeme hinweg verfügbar sind.
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Implementieren Sie bidirektionale Synchronisationen zwischen Systemen</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Etablieren Sie eine einheitliche Datennomenklatur über alle Systeme</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Implementieren Sie regelmäßige Datenqualitätsprüfungen</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                {/* More content for the data tab would go here */}
              </div>
              
              <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-start gap-3">
                  <LightBulbIcon className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-orange-800">Experten-Tipp:</h4>
                    <p className="text-gray-600">
                      Führen Sie eine regelmäßige Datenhygiene-Praxis ein: Bereinigen Sie Ihre Datenbanken von 
                      veralteten Kontakten, korrigieren Sie fehlerhafte Daten und konsolidieren Sie doppelte Einträge. 
                      Saubere Daten verbessern nicht nur die Effektivität Ihrer Automatisierung, sondern 
                      steigern auch die Deliverability Ihrer E-Mails und die Genauigkeit Ihrer Reports.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Other tabs would have similar content */}
            <TabsContent value="content">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">Content & Personalisierung Best Practices</h3>
                <p>Weitere Best Practices zu Content und Personalisierung folgen in Kürze.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="optimization">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">Messung & Optimierung Best Practices</h3>
                <p>Weitere Best Practices zu Messung und Optimierung folgen in Kürze.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Automation Process Steps */}
      <section id="automation-process" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">Methodische Vorgehensweise</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Unser bewährter Automatisierungs-Prozess</h2>
            <p className="text-gray-600 text-lg mb-6">
              Erfolgreiche Marketing-Automatisierung folgt einem strukturierten Prozess. 
              Lernen Sie unsere methodische Vorgehensweise kennen, die nachweisbare Ergebnisse liefert.
            </p>
          </div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-orange-500 to-red-500 transform -translate-x-1/2"></div>
            
            <div className="space-y-12 relative">
              {/* Step 1: Analysis */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <motion.div 
                  className="mb-8 md:mb-0 md:text-right"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="flex md:justify-end items-center text-2xl font-bold text-amber-800 mb-3">
                    <span>1. Analyse & Bedarfsermittlung</span>
                    <div className="hidden md:block w-10 h-10 rounded-full bg-amber-100 border-4 border-white shadow text-amber-600 flex-shrink-0 ml-4 flex items-center justify-center">
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </div>
                  </h3>
                  <p className="text-gray-600 max-w-md ml-auto mb-3">
                    Wir beginnen mit einer umfassenden Analyse Ihrer aktuellen Marketingprozesse, identifizieren Automatisierungspotenziale und definieren klare Ziele und KPIs für Ihre Marketing-Automatisierung.
                  </p>
                  <ul className="space-y-2 text-gray-600 max-w-md ml-auto">
                    <li className="flex justify-end gap-2">
                      <span>Prozessanalyse & Status-Quo-Bewertung</span>
                      <CheckCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    </li>
                    <li className="flex justify-end gap-2">
                      <span>Identifikation von Automatisierungspotentialen</span>
                      <CheckCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    </li>
                    <li className="flex justify-end gap-2">
                      <span>Zieldefinition & KPI-Festlegung</span>
                      <CheckCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    </li>
                    <li className="flex justify-end gap-2">
                      <span>Technologie-Evaluation & -Auswahl</span>
                      <CheckCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    </li>
                  </ul>
                </motion.div>
                
                <div className="block md:hidden w-10 h-10 rounded-full bg-amber-100 border-4 border-white shadow text-amber-600 mb-4 flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-amber-50 rounded-xl overflow-hidden shadow-sm border border-amber-100">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-amber-800 mb-3">Was Sie erhalten:</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Automatisierungs-Bedarfsanalyse</span>
                            <p className="text-sm text-gray-600">Detaillierte Analyse aller Automatisierungspotentiale in Ihrem Marketing</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Technologie-Assessment</span>
                            <p className="text-sm text-gray-600">Bewertung und Empfehlung geeigneter Technologien und Plattformen</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Automatisierungs-Roadmap</span>
                            <p className="text-sm text-gray-600">Strategischer Plan mit priorisierten Maßnahmen und Timeline</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Step 2: Strategy & Planning */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <motion.div 
                  className="order-2 mb-8 md:mb-0"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="flex items-center text-2xl font-bold text-orange-800 mb-3">
                    <div className="hidden md:block w-10 h-10 rounded-full bg-orange-100 border-4 border-white shadow text-orange-600 flex-shrink-0 mr-4 flex items-center justify-center">
                      <PresentationChartLineIcon className="h-5 w-5" />
                    </div>
                    <span>2. Strategie & Planung</span>
                  </h3>
                  <p className="text-gray-600 max-w-md mb-3">
                    Basierend auf den Analyseergebnissen entwickeln wir eine maßgeschneiderte Automatisierungsstrategie mit detaillierten Customer Journeys, Workflow-Designs und einem strukturierten Implementierungsplan.
                  </p>
                  <ul className="space-y-2 text-gray-600 max-w-md">
                    <li className="flex gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <span>Customer Journey Mapping & Segmentierung</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <span>Workflow-Design & Automatisierungslogik</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <span>Content-Strategie für automatisierte Kommunikation</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <span>Taktischer Implementierungsplan mit Meilensteinen</span>
                    </li>
                  </ul>
                </motion.div>
                
                <div className="block md:hidden w-10 h-10 rounded-full bg-orange-100 border-4 border-white shadow text-orange-600 mb-4 flex items-center justify-center">
                  <PresentationChartLineIcon className="h-5 w-5" />
                </div>
                
                <motion.div
                  className="order-1"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-orange-50 rounded-xl overflow-hidden shadow-sm border border-orange-100">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-orange-800 mb-3">Was Sie erhalten:</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Automatisierungs-Blueprint</span>
                            <p className="text-sm text-gray-600">Detaillierter Plan mit Customer Journeys und Workflow-Designs</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Segmentierungs-Framework</span>
                            <p className="text-sm text-gray-600">Strukturiertes Framework für präzise Kundensegmentierung</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <ChartBarIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Implementierungs-Roadmap</span>
                            <p className="text-sm text-gray-600">Phasenplan mit Meilensteinen und Ressourcenplanung</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Step 3: Implementation */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <motion.div 
                  className="mb-8 md:mb-0 md:text-right"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="flex md:justify-end items-center text-2xl font-bold text-red-800 mb-3">
                    <span>3. Implementierung & Integration</span>
                    <div className="hidden md:block w-10 h-10 rounded-full bg-red-100 border-4 border-white shadow text-red-600 flex-shrink-0 ml-4 flex items-center justify-center">
                      <CogIcon className="h-5 w-5" />
                    </div>
                  </h3>
                  <p className="text-gray-600 max-w-md ml-auto mb-3">
                    Wir implementieren die geplanten Automatisierungslösungen, integrieren alle erforderlichen Systeme und Datenquellen und stellen die nahtlose Funktion aller Komponenten sicher.
                  </p>
                  <ul className="space-y-2 text-gray-600 max-w-md ml-auto">
                    <li className="flex justify-end gap-2">
                      <span>Technische Implementierung & Konfiguration</span>
                      <CheckCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    </li>
                    <li className="flex justify-end gap-2">
                      <span>Datenintegration & API-Entwicklung</span>
                      <CheckCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    </li>
                    <li className="flex justify-end gap-2">
                      <span>Workflow-Einrichtung & Trigger-Definition</span>
                      <CheckCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    </li>
                    <li className="flex justify-end gap-2">
                      <span>Content-Erstellung & Template-Design</span>
                      <CheckCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    </li>
                  </ul>
                </motion.div>
                
                <div className="block md:hidden w-10 h-10 rounded-full bg-red-100 border-4 border-white shadow text-red-600 mb-4 flex items-center justify-center">
                  <CogIcon className="h-5 w-5" />
                </div>
                
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-red-50 rounded-xl overflow-hidden shadow-sm border border-red-100">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-red-800 mb-3">Was Sie erhalten:</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-red-200 text-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <CogIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Funktionale Automatisierungslösung</span>
                            <p className="text-sm text-gray-600">Vollständig implementierte und getestete Automatisierungsworkflows</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-red-200 text-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <CodeBracketIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Integrierte Systeme</span>
                            <p className="text-sm text-gray-600">Nahtlos verbundene Marketing- und CRM-Systeme</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 w-6 h-6 bg-red-200 text-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="h-3 w-3" />
                          </div>
                          <div>
                            <span className="font-medium">Content & Templates</span>
                            <p className="text-sm text-gray-600">Optimierte Inhalte und wiederverwendbare Templates für alle Kommunikationskanäle</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* More steps can be added following the same pattern */}
            </div>
            
            {/* Step Summary Section */}
            <div className="mt-16 text-center">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white mb-8">
                Erfahren Sie mehr über unseren Automatisierungsprozess
                <ArrowLongRightIcon className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="p-6 bg-amber-50 rounded-lg border border-amber-100 max-w-3xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full text-amber-800 flex items-center justify-center flex-shrink-0">
                    <LightBulbIcon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-amber-800 mb-2">Wussten Sie schon?</h3>
                    <p className="text-gray-700">
                      Die vollständige Implementierung einer Marketing-Automatisierungsstrategie folgt einem iterativen Prozess. 
                      Während erste Automatisierungen oft schon nach wenigen Wochen aktiv sein können, 
                      entwickelt sich eine umfassende Automatisierungslösung kontinuierlich weiter und wird mit wachsender Erfahrung 
                      immer leistungsfähiger. Unsere Kunden sehen im Durchschnitt bereits nach drei Monaten eine 
                      Effizienzsteigerung von 35% in ihren Marketingprozessen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Case Studies and Testimonials Section */}
      <section id="case-studies" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-orange-100 text-orange-800 border-orange-200">Erfolgsgeschichten</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Echte Automatisierungserfolge unserer Kunden</h2>
            <p className="text-gray-600 text-lg">
              Wir lassen Zahlen und zufriedene Kunden für sich sprechen. Hier sehen Sie eine Auswahl unserer Erfolgsgeschichten.
            </p>
          </div>

          {/* Case Studies */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Case Study 1 */}
            <motion.div
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-48 bg-gradient-to-r from-amber-600 to-orange-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/images/case-study-ecommerce-automation.jpg"
                    alt="E-Commerce Automation Case Study"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover opacity-70"
                  />
                </div>
                <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/70 to-transparent">
                  <Badge className="mb-2 bg-white/20 text-white border-white/20 backdrop-blur-sm">E-Commerce</Badge>
                  <h3 className="text-xl font-bold text-white">Mode-Online-Shop</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Email-Automation</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Personalisierung</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">CRM-Integration</span>
                </div>
                
                <h4 className="text-lg font-semibold mb-2">Die Herausforderung</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Der Online-Shop wollte die Conversion-Rate steigern, Warenkörbe zurückgewinnen und 
                  den Kundenservice entlasten, während das Team gleichzeitig mit dem Wachstum Schritt halten musste.
                </p>
                
                <h4 className="text-lg font-semibold mb-2">Unsere Lösung</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Wir implementierten eine umfassende E-Mail-Automatisierung mit Warenkorbabbruch-Sequenzen, 
                  personalisierten Produktempfehlungen und einem automatisierten Kundenservice-System.
                </p>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-lg font-semibold mb-3">Ergebnisse:</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">+28%</div>
                      <p className="text-xs text-gray-500">Conversion-Rate</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">+43%</div>
                      <p className="text-xs text-gray-500">Warenkorbretturns</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">-65%</div>
                      <p className="text-xs text-gray-500">Service-Anfragen</p>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-orange-600 border border-orange-200 hover:bg-orange-50">
                  Case Study lesen
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
            
            {/* Case Study 2 */}
            <motion.div
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="h-48 bg-gradient-to-r from-blue-600 to-teal-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/images/case-study-b2b-automation.jpg"
                    alt="B2B Automation Case Study"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover opacity-70"
                  />
                </div>
                <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/70 to-transparent">
                  <Badge className="mb-2 bg-white/20 text-white border-white/20 backdrop-blur-sm">B2B</Badge>
                  <h3 className="text-xl font-bold text-white">Industrielösungen GmbH</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Lead Nurturing</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Sales Automation</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">CRM-Integration</span>
                </div>
                
                <h4 className="text-lg font-semibold mb-2">Die Herausforderung</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Das B2B-Unternehmen suchte nach Wegen, den langen Sales-Cycle zu optimieren, die Lead-Qualifizierung zu verbessern 
                  und die Zusammenarbeit zwischen Marketing und Vertrieb zu stärken.
                </p>
                
                <h4 className="text-lg font-semibold mb-2">Unsere Lösung</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Wir implementierten einen automatisierten Lead-Nurturing-Prozess mit Lead-Scoring, 
                  nahtloser CRM-Integration und automatisierten Handoff-Prozessen zwischen Marketing und Vertrieb.
                </p>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-lg font-semibold mb-3">Ergebnisse:</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">+67%</div>
                      <p className="text-xs text-gray-500">Lead-Qualität</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">-32%</div>
                      <p className="text-xs text-gray-500">Sales-Cycle</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">+41%</div>
                      <p className="text-xs text-gray-500">Conversion-Rate</p>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-orange-600 border border-orange-200 hover:bg-orange-50">
                  Case Study lesen
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
            
            {/* Case Study 3 */}
            <motion.div
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/images/case-study-saas-automation.jpg"
                    alt="SaaS Automation Case Study"
                    width={400}
                    height={200}
                    className="w-full h-full object-cover opacity-70"
                  />
                </div>
                <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/70 to-transparent">
                  <Badge className="mb-2 bg-white/20 text-white border-white/20 backdrop-blur-sm">SaaS</Badge>
                  <h3 className="text-xl font-bold text-white">Cloud Software AG</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Onboarding-Automation</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Customer Success</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Churn-Prävention</span>
                </div>
                
                <h4 className="text-lg font-semibold mb-2">Die Herausforderung</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Das SaaS-Unternehmen wollte die Onboarding-Erfahrung verbessern, die Aktivierung neuer Nutzer 
                  beschleunigen und die Abwanderungsrate (Churn) reduzieren.
                </p>
                
                <h4 className="text-lg font-semibold mb-2">Unsere Lösung</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Wir entwickelten eine umfassende Automatisierungslösung mit personalisierten Onboarding-Sequenzen, 
                  nutzungsbasierten Engagement-Kampagnen und proaktiven Churn-Prevention-Maßnahmen.
                </p>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-lg font-semibold mb-3">Ergebnisse:</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">+52%</div>
                      <p className="text-xs text-gray-500">Aktivierungsrate</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">+38%</div>
                      <p className="text-xs text-gray-500">Feature-Adoption</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">-25%</div>
                      <p className="text-xs text-gray-500">Churn-Rate</p>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-orange-600 border border-orange-200 hover:bg-orange-50">
                  Case Study lesen
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
          
          {/* Testimonials */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-12">Was unsere Kunden sagen</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-md relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 rounded-full border-4 border-white shadow-sm overflow-hidden">
                    <Image
                      src="/images/testimonial-1-automation.jpg"
                      alt="Testimonial Author"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="pt-6">
                  <div className="flex items-center mb-2">
                    <div className="flex text-amber-400">
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <blockquote className="text-gray-600 italic mb-4">
                    "Die Implementierung der Marketing-Automatisierungslösung hat unsere Marketingprozesse revolutioniert. 
                    Unser Team spart wöchentlich über 25 Stunden an manueller Arbeit und kann sich nun auf kreative und 
                    strategische Aufgaben konzentrieren. Die Expertise und technische Kompetenz des Teams war beeindruckend."
                  </blockquote>
                  <div>
                    <p className="font-semibold">Thomas Meier</p>
                    <p className="text-sm text-gray-500">Marketing Director, DigiTech GmbH</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Testimonial 2 */}
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-md relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 rounded-full border-4 border-white shadow-sm overflow-hidden">
                    <Image
                      src="/images/testimonial-2-automation.jpg"
                      alt="Testimonial Author"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="pt-6">
                  <div className="flex items-center mb-2">
                    <div className="flex text-amber-400">
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                      <StarIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <blockquote className="text-gray-600 italic mb-4">
                    "Was uns besonders beeindruckt hat, ist die Kombination aus Marketing-Know-how und technischer 
                    Expertise. Das Team hat nicht nur Standard-Automatisierungen implementiert, sondern maßgeschneiderte 
                    Lösungen entwickelt, die genau auf unsere Bedürfnisse zugeschnitten sind. Der ROI übertraf alle Erwartungen."
                  </blockquote>
                  <div>
                    <p className="font-semibold">Hannah Schmidt</p>
                    <p className="text-sm text-gray-500">CEO, EcoProducts Online</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="text-center mt-12">
              <Button variant="outline" className="bg-white hover:bg-gray-50">
                Alle Erfolgsgeschichten ansehen
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <RocketLaunchIcon className="h-16 w-16 mx-auto mb-6 text-white/80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit, Ihr Marketing auf die nächste Stufe zu heben?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Vereinbaren Sie jetzt eine kostenlose Beratung und erfahren Sie, 
              wie maßgeschneiderte Automatisierungslösungen Ihr Marketing effizienter, 
              effektiver und skalierbarer machen können.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50">
                Kostenloses Automatisierungs-Assessment anfordern
                <ArrowLongRightIcon className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Mehr über unsere CORE-Plattform erfahren
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 