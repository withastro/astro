'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  ClipboardCheckIcon, 
  BarChartIcon, 
  TrendingUpIcon, 
  UsersIcon,
  SearchIcon,
  PencilIcon,
  Share2Icon,
  MonitorIcon,
  BookOpenIcon
} from 'lucide-react';

// No need to import SVGs since we're using direct paths

const contentServices = [
  {
    title: "SEO-Content Strategie",
    description: "Maßgeschneiderte Content-Strategien, die Suchmaschinenoptimierung mit wertvollem Content für Ihre Zielgruppe verbinden. Wir analysieren Keywords, Suchintentionen und Wettbewerber, um eine langfristige Content-Roadmap zu entwickeln.",
    icon: <SearchIcon className="h-10 w-10" />,
    benefits: ["Keyword-Recherche", "Suchintentionsanalyse", "Content-Kalender"],
    image: "/images/content-marketing/strategy.svg",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "Content-Erstellung",
    description: "Professionelle Erstellung von hochwertigem Content durch unsere spezialisierten Texter und Branchen-Experten. Von Blog-Artikeln über Whitepaper bis hin zu Case Studies – wir liefern Content, der informiert, überzeugt und konvertiert.",
    icon: <PencilIcon className="h-10 w-10" />,
    benefits: ["Blog-Artikel", "Whitepaper & E-Books", "Case Studies"],
    image: "/images/content-marketing/ideation.svg",
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    title: "Content-Distribution",
    description: "Strategische Verbreitung Ihrer Inhalte über die effektivsten Kanäle, um maximale Reichweite und Engagement zu erzielen. Wir sorgen dafür, dass Ihr wertvoller Content die richtigen Personen zur richtigen Zeit erreicht.",
    icon: <Share2Icon className="h-10 w-10" />,
    benefits: ["Social Media", "Email-Marketing", "Content Syndication"],
    image: "/images/content-marketing/distribution.svg",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "Content-Performance Analyse",
    description: "Kontinuierliche Messung und Optimierung Ihrer Content-Performance mit unseren fortschrittlichen Analyse-Tools. Wir identifizieren erfolgreiche Muster und optimieren kontinuierlich für bessere Ergebnisse.",
    icon: <BarChartIcon className="h-10 w-10" />,
    benefits: ["Performance-Tracking", "A/B-Testing", "Conversion-Optimierung"],
    image: "/images/content-marketing/analytics.svg",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "Storytelling & Branding",
    description: "Entwicklung überzeugender Markengeschichten, die emotionale Verbindungen zu Ihrer Zielgruppe aufbauen. Wir verbinden Content-Strategie mit strategischem Storytelling, um Ihre Marke authentisch zu positionieren.",
    icon: <BookOpenIcon className="h-10 w-10" />,
    benefits: ["Markennarrative", "Visual Storytelling", "Brand Messaging"],
    image: "/images/content-marketing/storytelling.svg",
    color: "bg-red-50 text-red-700 border-red-200"
  },
  {
    title: "Content-Automatisierung",
    description: "DSGVO-konforme Automatisierungslösungen für effiziente Content-Distribution und personalisierte User Journeys. Sparen Sie Zeit und Ressourcen durch intelligente Workflow-Optimierung.",
    icon: <MonitorIcon className="h-10 w-10" />,
    benefits: ["Personalisierung", "Workflow-Optimierung", "Skalierbarkeit"],
    image: "/images/content-marketing/automation.svg",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  }
];

const contentTypes = [
  {
    title: "Blog-Artikel & Ratgeber",
    description: "Informative und SEO-optimierte Artikel, die Ihre Expertise demonstrieren und organischen Traffic generieren.",
    icon: <PencilIcon className="h-8 w-8" />
  },
  {
    title: "Whitepaper & E-Books",
    description: "Umfassende Leitfäden und Expertenwissen für Lead-Generierung und Thought Leadership.",
    icon: <BookOpenIcon className="h-8 w-8" />
  },
  {
    title: "Case Studies & Erfolgsgeschichten",
    description: "Überzeugende Fallstudien, die Ihre Erfolge demonstrieren und Vertrauen aufbauen.",
    icon: <ClipboardCheckIcon className="h-8 w-8" />
  },
  {
    title: "Infografiken & Visuelle Inhalte",
    description: "Ansprechende visuelle Darstellungen komplexer Informationen für besseres Verständnis und Sharing.",
    icon: <TrendingUpIcon className="h-8 w-8" />
  },
  {
    title: "Webinare & Video-Content",
    description: "Interaktive Formate für tiefere Engagement und persönliche Verbindung zu Ihrer Zielgruppe.",
    icon: <MonitorIcon className="h-8 w-8" />
  },
  {
    title: "Social Media Content",
    description: "Plattformspezifische Inhalte, die Engagement fördern und Ihre Community aufbauen.",
    icon: <UsersIcon className="h-8 w-8" />
  }
];

const processSteps = [
  {
    step: 1,
    title: "Analyse & Strategie",
    description: "Umfassende Analyse Ihrer Marke, Zielgruppe, Mitbewerber und Marktposition. Wir definieren messbare Ziele und entwickeln eine maßgeschneiderte Content-Strategie.",
    color: "bg-blue-500"
  },
  {
    step: 2,
    title: "Keyword-Recherche & Content-Planung",
    description: "Identifikation relevanter Keywords und Entwicklung eines strategischen Content-Kalenders basierend auf Suchintentionen und Geschäftszielen.",
    color: "bg-green-500"
  },
  {
    step: 3,
    title: "Professionelle Content-Erstellung",
    description: "Erstellung hochwertiger Inhalte durch Experten, die Ihre Markenstimme authentisch repräsentieren und SEO-Best-Practices integrieren.",
    color: "bg-purple-500"
  },
  {
    step: 4,
    title: "Strategische Distribution",
    description: "Verbreitung Ihrer Inhalte über die effektivsten Kanäle, um maximale Reichweite und Engagement bei Ihrer Zielgruppe zu erzielen.",
    color: "bg-amber-500"
  },
  {
    step: 5,
    title: "Performance-Messung & Optimierung",
    description: "Kontinuierliche Analyse der Content-Performance und datengestützte Optimierung für stetig verbesserte Ergebnisse.",
    color: "bg-indigo-500"
  }
];

export default function ContentMarketingPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  return (
    <main className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Content Marketing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Content Strategie mit messbaren Ergebnissen</h1>
          <p className="text-xl text-gray-600">
            Wir verbinden strategisches Storytelling mit datengesteuerter SEO, 
            um Content zu erstellen, der informiert, überzeugt und konvertiert.
          </p>
        </motion.div>
      </section>

      {/* Overview Section */}
      <section className="bg-gray-50 py-20 mb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">Strategie trifft auf Kreativität</h2>
              <p className="text-gray-600 mb-4">
                Bei OnlineMarketingCORE verbinden wir datengetriebene Content-Strategien mit 
                kreativem Storytelling für maximale Wirkung. Unsere Content Marketing Agentur 
                in Berlin entwickelt hochwertige Inhalte, die nicht nur Ihre Zielgruppe begeistern, 
                sondern auch messbare Geschäftsergebnisse liefern.
              </p>
              <p className="text-gray-600 mb-4">
                Durch die Integration von SEO-Expertise und technischem Know-how 
                schaffen wir eine solide Grundlage für Ihren Content-Erfolg. 
                Unsere Texte sind nicht nur für Menschen optimiert, sondern auch für 
                Suchmaschinen – für nachhaltigen organischen Traffic und höhere Conversions.
              </p>
              <p className="text-gray-600">
                Mit unserer proprietären CORE-Plattform können wir Content-Performance in Echtzeit 
                messen und kontinuierlich optimieren. So erhalten Sie nicht nur Premium-Content, 
                sondern auch tiefe Einblicke in seine Wirksamkeit.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px] rounded-lg overflow-hidden"
            >
              <Image
                src="/images/content-marketing/slider.svg"
                alt="Content Strategie Entwicklung"
                width={800}
                height={400}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Unsere Content Marketing Dienstleistungen</h2>
          <p className="text-gray-600">
            Wir bieten ein vollständiges Spektrum an Content Marketing Services – 
            von der strategischen Planung über die Erstellung bis hin zur Distribution und Analyse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contentServices.map((service, index) => (
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
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
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

      {/* Content Types Section */}
      <section className="bg-gray-50 py-20 mb-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Vielfältige Inhalte</Badge>
            <h2 className="text-3xl font-bold mb-6">Content-Formate für jeden Bedarf</h2>
            <p className="text-gray-600">
              Wir erstellen verschiedenste Content-Typen, optimiert für Ihre spezifischen Geschäftsziele 
              und die Bedürfnisse Ihrer Zielgruppe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contentTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">
                  {type.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{type.title}</h3>
                <p className="text-gray-600">{type.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Unser Prozess</Badge>
          <h2 className="text-3xl font-bold mb-6">Wie wir arbeiten</h2>
          <p className="text-gray-600">
            Unser bewährter Prozess sorgt für konsistente Qualität und messbare Ergebnisse 
            bei jedem Content-Marketing-Projekt.
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
      <section className="bg-blue-50 py-20 mb-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Ergebnisse</Badge>
            <h2 className="text-3xl font-bold mb-6">Messbare Erfolge durch Content</h2>
            <p className="text-gray-600">
              Unsere Kunden erleben mit unseren Content-Strategien deutliche Verbesserungen 
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
              <div className="text-4xl font-bold text-green-600 mb-2">+143%</div>
              <p className="text-gray-600">Lead-Generierung</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">+94%</div>
              <p className="text-gray-600">Conversion-Rate</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-amber-600 mb-2">-38%</div>
              <p className="text-gray-600">Cost per Acquisition</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 text-center mb-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl py-16 px-4 md:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Bereit für erfolgreichen Content?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Lassen Sie uns gemeinsam eine Content-Strategie entwickeln, die Ihren Geschäftszielen 
              entspricht und messbare Ergebnisse liefert.
            </p>
            <Link href={`/${locale}/kontakt`}>
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Kostenlose Beratung vereinbaren
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 