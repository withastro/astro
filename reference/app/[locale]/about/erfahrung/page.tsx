'use client';

import { AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExperienceHero } from "@/app/components/hero/ExperienceHero";
import { ChartPieIcon, CpuChipIcon, GlobeEuropeAfricaIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// Define milestones
const milestones = [
  {
    year: 1998,
    title: "Gründung in Berlin",
    description: "Als kleine Agentur mit Fokus auf klassisches Webdesign und erste SEO-Ansätze starteten wir mit nur vier Mitarbeitern unsere Mission, digitales Marketing zu revolutionieren.",
    icon: <UserGroupIcon className="h-6 w-6 text-blue-600" />
  },
  {
    year: 2005,
    title: "Digitale Transformation",
    description: "Mit dem Aufkommen von Google AdWords und ersten Social Media Plattformen erweiterten wir unser Portfolio und entwickelten datengetriebene Marketingansätze für unsere Kunden.",
    icon: <ChartPieIcon className="h-6 w-6 text-green-600" />
  },
  {
    year: 2012,
    title: "Launch der CORE-Plattform",
    description: "Nach Jahren der Entwicklung präsentierten wir unsere proprietäre Marketing-Plattform, die Automatisierung, Datenanalyse und Content-Management nahtlos integriert.",
    icon: <CpuChipIcon className="h-6 w-6 text-purple-600" />
  },
  {
    year: 2019,
    title: "Europäische Expansion",
    description: "Mit der Eröffnung von Büros in Wien, Zürich und Amsterdam erweiterten wir unsere Präsenz auf dem europäischen Markt und bieten seitdem mehrsprachige Marketing-Lösungen an.",
    icon: <GlobeEuropeAfricaIcon className="h-6 w-6 text-amber-600" />
  },
  {
    year: 2024,
    title: "KI-Integration & Zukunftsvision",
    description: "Mit dem Einsatz modernster KI-Technologien in unserer CORE-Plattform definieren wir erneut die Standards im digitalen Marketing und automatisieren komplexe Prozesse.",
    icon: <AcademicCapIcon className="h-6 w-6 text-red-600" />
  }
];

// Industry experience
const industries = [
  {
    name: "E-Commerce",
    description: "Seit über 15 Jahren unterstützen wir Online-Shops dabei, ihre Conversion-Raten zu verbessern und Kundenbindung zu stärken. Unsere Expertise umfasst alle führenden Plattformen von Shopify bis Magento.",
    clients: 120,
    icon: "/images/industries/ecommerce-icon.svg"
  },
  {
    name: "B2B",
    description: "Für B2B-Unternehmen haben wir spezialisierte Lead-Generierungs- und Nurturing-Strategien entwickelt, die komplexe Verkaufszyklen unterstützen und qualifizierte Geschäftskontakte liefern.",
    clients: 85,
    icon: "/images/industries/b2b-icon.svg"
  },
  {
    name: "SaaS & Tech",
    description: "Technologieunternehmen profitieren von unserem tiefen Verständnis für ihre Produkte und Zielgruppen. Wir helfen dabei, komplexe Lösungen verständlich zu kommunizieren und Leads zu generieren.",
    clients: 65,
    icon: "/images/industries/saas-icon.svg"
  },
  {
    name: "Healthcare",
    description: "Im sensiblen Gesundheitsbereich bieten wir DSGVO-konforme Marketinglösungen, die Vertrauen aufbauen und gleichzeitig die strengen regulatorischen Anforderungen erfüllen.",
    clients: 40,
    icon: "/images/industries/healthcare-icon.svg"
  }
];

// Core competencies
const competencies = [
  {
    title: "Marketing-Technologie",
    description: "Entwicklung maßgeschneiderter Technologielösungen, die Marketing-Prozesse automatisieren und optimieren. Von API-Integrationen bis zu vollständigen Marketing-Stacks.",
    skills: ["API-Entwicklung", "Automatisierung", "System-Integration", "Custom Analytics"]
  },
  {
    title: "Datenanalyse & Insights",
    description: "Umfassende Datenanalyse über alle Marketingkanäle hinweg mit proprietären Tools, die tiefere Einblicke als Standard-Lösungen bieten und versteckte Potentiale aufdecken.",
    skills: ["Trackingkonzepte", "Attributionsmodelle", "Predictive Analytics", "Conversion-Analyse"]
  },
  {
    title: "Strategische Beratung",
    description: "Ganzheitliche Marketingstrategien, die auf soliden Daten und langjähriger Branchenerfahrung basieren. Wir identifizieren Chancen und entwickeln skalierbare Konzepte.",
    skills: ["Marktanalyse", "Wettbewerbsanalyse", "Zielgruppenentwicklung", "Go-to-Market"]
  },
  {
    title: "Digitale Performance",
    description: "Performanceorientierte Umsetzung von Marketingmaßnahmen mit kontinuierlicher Optimierung und transparentem Reporting. Fokus auf messbaren ROI und nachhaltigem Wachstum.",
    skills: ["SEO", "SEA", "Social Media", "Content Marketing", "Conversion-Optimierung"]
  }
];

// Certifications
const certifications = [
  {
    name: "Google Partner Premier",
    year: 2015,
    description: "Höchste Auszeichnung für Google Advertising Partner mit nachgewiesener Expertise in Search, Display und Video Advertising.",
    image: "/images/certifications/google-partner.svg"
  },
  {
    name: "Microsoft Advertising Partner",
    year: 2018,
    description: "Offizieller Microsoft Advertising Partner mit Spezialisierung auf Bing Ads und Microsoft Audience Network.",
    image: "/images/certifications/microsoft-partner.svg"
  },
  {
    name: "Meta Business Partner",
    year: 2019,
    description: "Zertifizierter Partner für Facebook, Instagram und WhatsApp Advertising mit Fokus auf Performance Marketing.",
    image: "/images/certifications/meta-partner.svg"
  },
  {
    name: "HubSpot Solutions Partner",
    year: 2020,
    description: "Gold-Level Solutions Partner für HubSpot CRM, Marketing Hub und Sales Hub Implementierungen.",
    image: "/images/certifications/hubspot-partner.svg"
  },
  {
    name: "ISO 27001 Zertifizierung",
    year: 2021,
    description: "Zertifizierung für Informationssicherheitsmanagement gemäß internationaler Standards.",
    image: "/images/certifications/iso-27001.svg"
  }
];

// Testimonials about experience
const testimonials = [
  {
    quote: "OnlineMarketingCORE hat uns mit ihrer technischen Expertise beeindruckt. Sie haben komplexe API-Verknüpfungen realisiert, die unsere Marketingprozesse revolutioniert haben und die andere Agenturen für unmöglich hielten.",
    author: "Dr. Michael Lang",
    position: "CTO, TechVision GmbH",
    company: "TechVision GmbH",
    industry: "SaaS",
    year: 2023,
    image: "/images/testimonials/testimonial-1.jpg"
  },
  {
    quote: "Die jahrelange Erfahrung spürt man in jedem Detail der Zusammenarbeit. Das Team hat Tracking-Probleme identifiziert, die seit Jahren unentdeckt waren, und uns dadurch geholfen, unsere Marketing-Attribution grundlegend zu verbessern.",
    author: "Sabine Weber",
    position: "Marketing Director",
    company: "EuroShop24",
    industry: "E-Commerce",
    year: 2022,
    image: "/images/testimonials/testimonial-2.jpg"
  },
  {
    quote: "Nach 10 Jahren Zusammenarbeit bin ich immer wieder beeindruckt, wie OnlineMarketingCORE stets auf dem neuesten Stand der Technologie ist und uns proaktiv mit innovativen Lösungen berät. Eine Partnerschaft, die wirklich Mehrwert schafft.",
    author: "Thomas Müller",
    position: "CEO",
    company: "HealthTech Solutions",
    industry: "Healthcare",
    year: 2023,
    image: "/images/testimonials/testimonial-3.jpg"
  }
];

export default function ErfahrungPage() {
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
      <ExperienceHero />

      {/* Introduction Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Mehr als zwei Jahrzehnte digitale Exzellenz
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Seit unserer Gründung im Jahr 1998 haben wir die digitale Marketinglandschaft in Deutschland und Europa mitgestaltet. Was als kleine Webdesign-Agentur begann, hat sich zu einem führenden Anbieter von integrierten Online-Marketing-Lösungen entwickelt, der an der Schnittstelle von Marketing und Technologie arbeitet.
            </motion.p>
            <motion.p 
              className="text-lg text-gray-600 mt-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Unsere langjährige Erfahrung ermöglicht es uns, tiefe Einblicke in Branchen, Technologien und Konsumentenverhalten zu gewinnen – Wissen, das wir für den Erfolg unserer Kunden einsetzen.
            </motion.p>
          </div>
          
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            <motion.div 
              className="p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">25+</div>
              <div className="text-gray-600">Jahre Erfahrung</div>
            </motion.div>
            
            <motion.div 
              className="p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Projekte</div>
            </motion.div>
            
            <motion.div 
              className="p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">15+</div>
              <div className="text-gray-600">Branchen</div>
            </motion.div>
            
            <motion.div 
              className="p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">4</div>
              <div className="text-gray-600">Standorte in Europa</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Unsere Reise
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Ein Rückblick auf die wichtigsten Meilensteine unserer Geschichte und wie sie uns zu dem gemacht haben, was wir heute sind
            </motion.p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div 
                key={index}
                className={`flex flex-col md:flex-row gap-4 mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Year */}
                <div className="md:w-1/4 flex flex-col items-center md:items-start">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <span className="text-xl font-bold text-blue-600">{milestone.year}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="md:w-3/4 bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="mr-3">
                      {milestone.icon}
                    </div>
                    <h3 className="text-xl font-bold">{milestone.title}</h3>
                  </div>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
            
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gray-300 z-0"></div>
          </div>
        </div>
      </section>
      
      {/* Industry Experience */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Branchenexpertise
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              In mehr als zwei Jahrzehnten haben wir tiefgreifendes Know-how in verschiedenen Branchen aufgebaut
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 rounded-xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="inline-block mb-4">
                  {/* Placeholder for SVG icons */}
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{industry.name[0]}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{industry.name}</h3>
                <p className="text-gray-600 mb-4">{industry.description}</p>
                <div className="text-blue-600 font-bold">
                  {industry.clients}+ Kunden
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Core Competencies */}
      <section className="py-16 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Unsere Kernkompetenzen
            </motion.h2>
            <motion.p 
              className="text-xl text-blue-200 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              An der Schnittstelle von Marketing und Technologie haben wir einzigartige Kompetenzen entwickelt
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {competencies.map((competency, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-xl font-bold mb-3">{competency.title}</h3>
                <p className="text-blue-100 mb-6">{competency.description}</p>
                <div className="flex flex-wrap gap-2">
                  {competency.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="bg-white/20 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Certifications */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Zertifizierungen & Partnerschaften
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Unsere Expertise wird durch offizielle Zertifizierungen und starke Partnerschaften bestätigt
            </motion.p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                className="text-center w-[280px]"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="bg-gray-100 w-24 h-24 mx-auto rounded-full mb-4 flex items-center justify-center">
                  {/* Placeholder for certification logos */}
                  <div className="text-blue-600 font-bold">Logo</div>
                </div>
                <h3 className="font-bold mb-1">{cert.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Seit {cert.year}</p>
                <p className="text-sm text-gray-600">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Das sagen unsere Kunden
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Langjährige Partnerschaften basierend auf Vertrauen und messbaren Erfolgen
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-6">
                  <div className="mb-4 text-blue-600">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-lg">★</span>
                    ))}
                  </div>
                  <blockquote className="text-gray-600 italic mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                    <div>
                      <div className="font-bold">{testimonial.author}</div>
                      <div className="text-sm text-gray-500">{testimonial.position}</div>
                      <div className="text-sm text-gray-500">{testimonial.company} • {testimonial.year}</div>
                    </div>
                  </div>
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
            <h2 className="text-3xl font-bold mb-4">Profitieren Sie von unserer Erfahrung</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Lassen Sie uns gemeinsam besprechen, wie unsere 25+ Jahre Erfahrung Ihr digitales Marketing auf ein neues Level heben können.
            </p>
            <Link href={localizeHref("/contact/consultation")}>
              <Button size="lg" variant="secondary">
                Kostenlose Erstberatung vereinbaren
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 