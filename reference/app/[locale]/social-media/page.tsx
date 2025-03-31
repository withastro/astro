'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SocialMediaHero } from '@/app/components/hero/SocialMediaHero';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter,
  Youtube,
  TrendingUp, 
  BarChart, 
  Users,
  MessageCircle,
  Share2,
  Search,
  HeartHandshake
} from 'lucide-react';

const socialMediaServices = [
  {
    title: "Strategie & Beratung",
    description: "Umfassende Analyse Ihrer Zielgruppe und maßgeschneiderte Strategie für eine effektive Social Media Präsenz. Wir entwickeln klare Ziele, definieren relevante KPIs und erstellen einen konkreten Aktionsplan für nachhaltigen Erfolg.",
    icon: <TrendingUp className="h-10 w-10" />,
    benefits: ["Zielgruppenanalyse", "Kanalstrategie", "Wettbewerbsanalyse"],
    image: "/images/social-media/strategy.jpg",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "Content Creation",
    description: "Professionelle Erstellung von ansprechendem und zielgruppenrelevantem Content. Unser Kreativteam produziert hochwertige Texte, Grafiken, Fotos und Videos, die Ihre Marke authentisch repräsentieren und maximales Engagement erzeugen.",
    icon: <MessageCircle className="h-10 w-10" />,
    benefits: ["Visual Content", "Copywriting", "Video-Produktion"],
    image: "/images/social-media/content.jpg",
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    title: "Community Management",
    description: "Aktive Betreuung Ihrer Social-Media-Kanäle und kontinuierlicher Aufbau einer engagierten Community. Wir übernehmen die tägliche Moderation, reagieren zeitnah auf Kommentare und Anfragen und sorgen für lebendige Interaktion.",
    icon: <Users className="h-10 w-10" />,
    benefits: ["Reaktionsmanagement", "Community-Building", "Krisenmanagement"],
    image: "/images/social-media/community.jpg",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "Social Media Advertising",
    description: "Datengestützte Werbekampagnen für maximale Reichweite und Conversion. Unsere Performance-Spezialisten entwickeln zielgruppenspezifische Anzeigen, optimieren kontinuierlich und sorgen für effiziente Nutzung Ihres Werbebudgets.",
    icon: <TrendingUp className="h-10 w-10" />,
    benefits: ["Kampagnenplanung", "A/B-Testing", "Conversion-Optimierung"],
    image: "/images/social-media/advertising.jpg",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    title: "Influencer Marketing",
    description: "Strategische Kooperationen mit relevanten Influencern für authentische Markenbotschaften. Wir identifizieren passende Creator, entwickeln Kampagnenkonzepte und koordinieren die Zusammenarbeit für maximale Wirkung.",
    icon: <HeartHandshake className="h-10 w-10" />,
    benefits: ["Influencer-Recherche", "Kampagnenkonzeption", "Performance-Tracking"],
    image: "/images/social-media/influencer.jpg",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "Social Media Analytics",
    description: "Umfassendes Reporting und tiefgreifende Analyse Ihrer Social-Media-Performance. Wir liefern aussagekräftige Insights, identifizieren Optimierungspotentiale und entwickeln datenbasierte Handlungsempfehlungen.",
    icon: <BarChart className="h-10 w-10" />,
    benefits: ["Performance-Tracking", "Audience-Analyse", "Wettbewerbsvergleich"],
    image: "/images/social-media/analytics.jpg",
    color: "bg-green-50 text-green-700 border-green-200"
  }
];

const platforms = [
  {
    title: "Instagram",
    description: "Visuelle Storytelling-Plattform für emotionale Markenkommunikation und Community-Aufbau.",
    icon: <Instagram className="h-8 w-8" />
  },
  {
    title: "Facebook",
    description: "Reichweitenstarke Plattform für breite Zielgruppen und umfangreiche Werbemöglichkeiten.",
    icon: <Facebook className="h-8 w-8" />
  },
  {
    title: "LinkedIn",
    description: "Professionelles Netzwerk für B2B-Kommunikation, Employer Branding und Thought Leadership.",
    icon: <Linkedin className="h-8 w-8" />
  },
  {
    title: "Twitter",
    description: "Dialogplattform für Marken-PR, Kundenservice und zeitnahe Kommunikation.",
    icon: <Twitter className="h-8 w-8" />
  },
  {
    title: "YouTube",
    description: "Video-Plattform für langfristigen Content-Aufbau und tiefgehende Markengeschichten.",
    icon: <Youtube className="h-8 w-8" />
  },
  {
    title: "TikTok",
    description: "Trend-Plattform für authentische, kreative Inhalte und jüngere Zielgruppen.",
    icon: <Share2 className="h-8 w-8" />
  }
];

const processSteps = [
  {
    step: 1,
    title: "Analyse & Strategie",
    description: "Umfassende Analyse Ihrer aktuellen Social Media Präsenz, Ihrer Zielgruppe, Wettbewerber und Marktposition. Wir definieren messbare Ziele und entwickeln eine maßgeschneiderte Social Media Strategie.",
    color: "bg-blue-500"
  },
  {
    step: 2,
    title: "Content-Konzeption",
    description: "Entwicklung eines Redaktionsplans basierend auf relevanten Themen, Trends und Saisonalitäten. Wir definieren den optimalen Content-Mix für Ihre Zielgruppe und Marke.",
    color: "bg-pink-500"
  },
  {
    step: 3,
    title: "Content-Produktion",
    description: "Professionelle Erstellung von hochwertigem Content durch unser Kreativteam. Wir produzieren Texte, Grafiken, Fotos und Videos, die Ihre Markenstimme authentisch repräsentieren.",
    color: "bg-purple-500"
  },
  {
    step: 4,
    title: "Publikation & Community Management",
    description: "Strategisches Ausspielen der Inhalte und aktive Betreuung Ihrer Kanäle. Wir fördern Interaktionen, reagieren auf Kommentare und bauen eine lebendige Community auf.",
    color: "bg-indigo-500"
  },
  {
    step: 5,
    title: "Performance-Messung & Optimierung",
    description: "Kontinuierliche Analyse der Content-Performance und datengestützte Optimierung Ihrer Strategie und Inhalte für stetig verbesserte Ergebnisse.",
    color: "bg-green-500"
  }
];

export default function SocialMediaPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  return (
    <main className="min-h-screen">
      {/* Hero Section with Slider */}
      <SocialMediaHero />

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Unsere Social Media Services</h2>
          <p className="text-gray-600">
            Wir bieten ein vollständiges Spektrum an Social Media Dienstleistungen – 
            von der strategischen Beratung über Content-Produktion bis hin zum Community Management und Performance Marketing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {socialMediaServices.map((service, index) => (
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

      {/* Platforms Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Plattform-Expertise</Badge>
            <h2 className="text-3xl font-bold mb-6">Optimierte Strategien für jede Plattform</h2>
            <p className="text-gray-600">
              Jede Social-Media-Plattform folgt eigenen Regeln und bietet unterschiedliche Möglichkeiten. 
              Wir entwickeln plattformspezifische Strategien für maximale Wirkung.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">
                  {platform.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{platform.title}</h3>
                <p className="text-gray-600">{platform.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Unser Prozess</Badge>
          <h2 className="text-3xl font-bold mb-6">Wie wir arbeiten</h2>
          <p className="text-gray-600">
            Unser bewährter Prozess sorgt für konsistente Qualität und messbare Ergebnisse 
            bei jedem Social-Media-Projekt.
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
            <h2 className="text-3xl font-bold mb-6">Messbare Erfolge durch Social Media</h2>
            <p className="text-gray-600">
              Unsere Kunden erleben mit unseren Social-Media-Strategien deutliche Verbesserungen 
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
              <div className="text-4xl font-bold text-blue-600 mb-2">+215%</div>
              <p className="text-gray-600">Engagement-Rate</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-pink-600 mb-2">+167%</div>
              <p className="text-gray-600">Follower-Wachstum</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">+83%</div>
              <p className="text-gray-600">Traffic-Zunahme</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm text-center"
            >
              <div className="text-4xl font-bold text-indigo-600 mb-2">-42%</div>
              <p className="text-gray-600">Cost per Lead</p>
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
            <h2 className="text-3xl font-bold mb-6">Bereit für erfolgreiche Social Media Präsenz?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Lassen Sie uns gemeinsam eine Social-Media-Strategie entwickeln, die Ihre Zielgruppe begeistert und 
              messbare Geschäftsergebnisse liefert.
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