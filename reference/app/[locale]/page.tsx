'use client';

import { BrandedHero } from '@/app/components/hero/BrandedHero';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { 
  ArrowLongRightIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  ChartBarIcon, 
  ChartPieIcon,
  CogIcon,
  CommandLineIcon,
  CubeTransparentIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  GlobeAltIcon, 
  LightBulbIcon,
  PresentationChartLineIcon,
  RocketLaunchIcon,
  ServerIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import { 
  B2BIndustrySvg,
  EcommerceSvg,
  EnterpriseSvg,
  HealthcareSvg,
  ITSaaSSvg,
  LocalServiceSvg,
} from '@/app/components/svg/IndustrySvgs';

// The categories we offer - balanced presentation including CORE as one element
const categories = [
  {
    id: "seo",
    title: "SEO",
    description: "Nachhaltige Suchmaschinenoptimierung mit messbaren Ergebnissen. Wir verbessern Rankings, steigern organischen Traffic und optimieren für lokale Sichtbarkeit durch technische Expertise und datengetriebene Strategien.",
    icon: <GlobeAltIcon className="h-6 w-6" />,
    color: "bg-green-50 text-green-700 border-green-200",
    href: "/seo"
  },
  {
    id: "google-ads",
    title: "Google Ads",
    description: "Performance-orientierte Werbekampagnen für maximalen ROI. Unsere zertifizierten Experten entwickeln und optimieren kontinuierlich Ihre Google Ads-Kampagnen mit präzisem Targeting und datengesteuerter Gebotssteuerung.",
    icon: <ChartBarIcon className="h-6 w-6" />,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    href: "/services/google-werbung"
  },
  {
    id: "content-marketing",
    title: "Content Marketing",
    description: "Strategische Content-Erstellung für mehr Sichtbarkeit und Conversions. Wir verbinden SEO-Optimierung mit ansprechendem Storytelling, um Ihre Zielgruppe zu erreichen, zu überzeugen und zu konvertieren.",
    icon: <DocumentTextIcon className="h-6 w-6" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    href: "/content-marketing"
  },
  {
    id: "core-platform",
    title: "CORE Platform",
    description: "Unsere proprietäre Marketing-Technologie für individuelle Lösungen. Automatisierte Workflows, nahtlose API-Integrationen und maßgeschneiderte Reporting-Tools vereinen Marketing und IT für maximale Effizienz.",
    icon: <ServerIcon className="h-6 w-6" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    href: "/core-plattform"
  },
  {
    id: "analytics",
    title: "Web Analytics",
    description: "Datengestützte Entscheidungsfindung durch präzises Tracking. Wir decken versteckte Insights auf, optimieren Ihre Conversion-Wege und stellen sicher, dass Ihr Tracking DSGVO-konform und lückenlos ist.",
    icon: <PresentationChartLineIcon className="h-6 w-6" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    href: "/web-analytics"
  },
  {
    id: "automation",
    title: "Marketing Automation",
    description: "DSGVO-konforme Automatisierung für effizientere Prozesse. Reduzieren Sie manuelle Aufgaben und steigern Sie die Kundenbindung durch personalisierte, automatisierte Customer Journeys und Lead-Nurturing-Kampagnen.",
    icon: <CogIcon className="h-6 w-6" />,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    href: "/marketing-automatisierung"
  }
];

const features = [
  {
    title: "Maßgeschneiderte API-Integrationen",
    description: "Nahtlose Verbindung zwischen Marketing-Plattformen, CRM-Systemen, Analytics und ERP – alles aus einer Hand dank eigener Entwicklerteams. Wir verbinden Datensilos und schaffen ein einheitliches Ökosystem für Ihr digitales Marketing.",
    icon: <CommandLineIcon className="h-6 w-6" />,
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "Automatisierte SEO-Workflows",
    description: "Intelligente Automatisierungen, die das Ranking Ihrer Website kontinuierlich verbessern – anders als herkömmliche SEO-Agenturen. Unsere Systeme erkennen Optimierungspotentiale in Echtzeit und setzen Maßnahmen proaktiv um.",
    icon: <ArrowPathIcon className="h-6 w-6" />,
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    title: "Präzises Cross-Channel-Tracking",
    description: "Lückenlose Attribution über alle Touchpoints – entdecken Sie die blinden Flecken in Ihrem bestehenden Setup. Verfolgen Sie den gesamten Customer Journey von der ersten Interaktion bis zur Conversion und darüber hinaus.",
    icon: <ChartBarIcon className="h-6 w-6" />,
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "Datengetriebene Entscheidungsfindung",
    description: "Transformieren Sie Marketingdaten in wertvolle Business Intelligence für strategische Entscheidungen. Unsere Dashboards und Reports liefern nicht nur Metriken, sondern umsetzbare Erkenntnisse für Ihr Marketing und Geschäftswachstum.",
    icon: <CubeTransparentIcon className="h-6 w-6" />,
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "Enterprise-Level Sicherheit",
    description: "100% DSGVO-konforme Lösungen, entwickelt und gehostet in Deutschland – Datenschutz als Grundprinzip. Wir implementieren höchste Sicherheitsstandards für den Schutz sensibler Kundendaten und Geschäftsinformationen.",
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    color: "bg-red-50 text-red-700 border-red-200"
  },
  {
    title: "Skalierbare Cloud-Architektur",
    description: "Von mittelständischen Unternehmen bis zu internationalen Konzernen – unsere Plattform wächst mit Ihren Anforderungen. Die flexible Infrastruktur passt sich dynamisch an wechselnde Anforderungen und Datenvolumen an.",
    icon: <ServerIcon className="h-6 w-6" />,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  }
];

  const services = [
    {
    title: 'Suchmaschinenoptimierung',
    description: 'Intelligente SEO-Strategien mit nachweisbaren Ergebnissen durch technisches Know-how und Automatisierung. Wir verbessern nicht nur Rankings, sondern steigern qualifizierten Traffic und Conversions durch ganzheitliche On-Page und Off-Page Optimierung.',
      icon: <GlobeAltIcon className="h-6 w-6" />,
    stats: 'Ø 47% mehr organischer Traffic',
    href: '/seo',
    badges: ['Technische SEO', 'Content-Strategie', 'Local SEO']
  },
  {
    title: 'Google Werbung',
    description: 'Datengestützte Google Ads Kampagnen mit präziser Zielgruppenansprache und kontinuierlicher Optimierung. Wir maximieren Ihren ROAS durch intelligente Gebotsstrategien, A/B-Tests und ein tiefgreifendes Verständnis der Google Ads-Plattform.',
    icon: <ChartBarIcon className="h-6 w-6" />,
    stats: 'Ø 32% niedrigere CPA',
    href: '/services/google-werbung',
    badges: ['Search', 'Display', 'Performance Max']
  },
  {
    title: 'Content Marketing',
    description: 'Strategische Content-Entwicklung für maximale Reichweite, Engagement und Konversion. Von SEO-optimierten Blog-Artikeln bis hin zu überzeugenden Landing Pages – wir erstellen Content, der Ihre Zielgruppe begeistert und Ihre Geschäftsziele unterstützt.',
    icon: <LightBulbIcon className="h-6 w-6" />,
    stats: '10x Content-Performance',
    href: '/content-marketing',
    badges: ['SEO-Content', 'Storytelling', 'Content-Distribution']
    },
    {
      title: 'Marketing Automatisierung',
    description: 'DSGVO-konforme Automatisierungslösungen für effizientere Marketing-Prozesse und höhere Konversionsraten. Sparen Sie Zeit und Ressourcen durch automatisierte E-Mail-Sequenzen, personalisierten Content und datengesteuerte Customer Journeys.',
      icon: <CogIcon className="h-6 w-6" />,
    stats: '89% Zeitersparnis',
    href: '/marketing-automatisierung',
    badges: ['Workflows', 'Lead-Nurturing', 'Personalisierung']
  }
];

const industries = [
  { 
    name: "B2B Unternehmen", 
    href: "/branchen/b2b", 
    image: "/images/industries/b2b.jpg",
    SvgComponent: B2BIndustrySvg 
  },
  { 
    name: "Online Shops", 
    href: "/branchen/online-shops", 
    image: "/images/industries/ecommerce.jpg",
    SvgComponent: EcommerceSvg 
  },
  { 
    name: "Lokale Dienstleister", 
    href: "/branchen/lokale-dienstleister", 
    image: "/images/industries/local.jpg",
    SvgComponent: LocalServiceSvg 
  },
  { 
    name: "Enterprise Kunden", 
    href: "/branchen/enterprise", 
    image: "/images/industries/enterprise.jpg",
    SvgComponent: EnterpriseSvg 
  },
  { 
    name: "IT & SaaS", 
    href: "/branchen/it-saas", 
    image: "/images/industries/it-saas.jpg",
    SvgComponent: ITSaaSSvg 
  },
  { 
    name: "Healthcare", 
    href: "/branchen/healthcare", 
    image: "/images/industries/healthcare.jpg",
    SvgComponent: HealthcareSvg 
  }
];

const testimonials = [
  {
    quote: "Seit wir mit OnlineMarketingCORE zusammenarbeiten, konnten wir unsere Marketing-Prozesse um 78% automatisieren und die Conversion-Rate um 34% steigern. Die maßgeschneiderte CORE-Plattform hat unsere Erwartungen übertroffen. Besonders beeindruckend ist die nahtlose Integration mit unseren bestehenden Systemen und die Flexibilität bei der Anpassung an unsere spezifischen Anforderungen.",
    author: "Markus Schmidt",
    position: "CMO, TechVision GmbH",
    image: "/images/testimonials/testimonial-1.jpg"
  },
  {
    quote: "Das Team hat Tracking-Probleme identifiziert, die jahrelang unentdeckt blieben. Nach der Implementierung ihrer Lösungen konnten wir endlich die wahre Performance unserer Marketingaktivitäten messen und optimieren. Die Transparenz, die wir jetzt über den gesamten Customer Journey haben, hat uns ermöglicht, unsere Marketingausgaben deutlich effizienter einzusetzen und unseren ROI nachweisbar zu steigern.",
    author: "Julia Meyer",
    position: "Digital Marketing Director, ShopMax",
    image: "/images/testimonials/testimonial-2.jpg"
  },
  {
    quote: "Die technische Expertise bei OnlineMarketingCORE ist beeindruckend. Sie haben API-Verbindungen hergestellt, die andere Agenturen für unmöglich hielten, und uns dadurch einen enormen Wettbewerbsvorteil verschafft. Durch die automatisierten Workflows sparen wir nicht nur Zeit und Ressourcen, sondern können auch viel schneller auf Marktveränderungen reagieren und neue Marketing-Chancen nutzen.",
    author: "Thomas Weber",
    position: "CTO, InnovateX",
    image: "/images/testimonials/testimonial-3.jpg"
  }
];

const resources = [
  {
    title: "Der ultimative Guide für lückenloses Conversion-Tracking",
    category: "Whitepaper",
    description: "Erfahren Sie, wie Sie unentdeckte Conversion-Wege aufdecken und Ihre Marketing-Attribution optimieren können. Unser umfassender Guide enthält praktische Tipps und Anleitungen für die Implementierung eines lückenlosen, DSGVO-konformen Tracking-Setups.",
    image: "/images/resources/whitepaper-1.jpg",
    href: "/resources/conversion-tracking-guide"
  },
  {
    title: "Marketing-Automatisierung im B2B-Bereich",
    category: "Webinar",
    description: "Lernen Sie in diesem On-Demand Webinar, wie B2B-Unternehmen ihren Sales-Funnel durch Automatisierung optimieren können. Entdecken Sie bewährte Strategien für Lead-Qualifizierung, Nurturing-Kampagnen und effiziente Sales-Marketing-Alignment-Prozesse.",
    image: "/images/resources/webinar-1.jpg",
    href: "/resources/b2b-marketing-automation-webinar"
  },
  {
    title: "SEO-Trends 2023: Was wirklich funktioniert",
    category: "Blog",
    description: "Aktuelle SEO-Strategien basierend auf Datenanalysen von über 1.000 Websites in den wettbewerbsintensivsten Branchen. Erhalten Sie Einblicke in die effektivsten On-Page und Off-Page Optimierungen sowie Content-Strategien für nachhaltigen SEO-Erfolg.",
    image: "/images/resources/blog-1.jpg",
    href: "/blog/seo-trends-2023"
  }
];

export default function Home() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  const localizeHref = (href: string) => {
    if (href.startsWith('/')) {
      return `/${locale}${href}`;
    }
    return href;
  };

  // Animation variants for staggered children
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Enhanced Slider */}
      <BrandedHero />

      {/* All Categories Section - Balanced presentation */}
      <section id="categories" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Unsere Leistungen</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ganzheitliches Online Marketing für Ihren Erfolg</h2>
            <p className="text-gray-600 text-lg mb-6">
              Von SEO und Google Ads bis hin zu Content Marketing und unserer proprietären CORE Platform – 
              Wir bieten ein vollständiges Spektrum an digitalen Marketingdiensten für nachhaltige Ergebnisse.
            </p>
            
            <div className="text-gray-600 max-w-3xl mx-auto text-left">
              <p className="mb-4">
                Mit über 25 Jahren Erfahrung an der Schnittstelle zwischen IT und Marketing verstehen wir digitale Transformation wie kaum ein anderer. Unsere 30 spezialisierten Teams vereinen technisches Know-how mit strategischer Marketing-Expertise, um maßgeschneiderte Lösungen zu entwickeln, die Ihren ROI nachweisbar steigern.
              </p>
              <p className="mb-4">
                Anders als herkömmliche Agenturen berechnen wir den wahren ROI unter Berücksichtigung aller Faktoren – einschließlich Ihres Zeitaufwands und der tatsächlichen Agenturkosten. Unser Pinky Promise: Wir machen Schluss mit Marketing-Luftschlössern und liefern messbare Ergebnisse durch datengetriebene, DSGVO-konforme Strategien.
              </p>
              <p>
                Entdecken Sie unser umfassendes Leistungsspektrum für Online Marketing in Berlin und darüber hinaus. Von lokalen SEO-Maßnahmen für standortbezogene Unternehmen bis hin zu komplexen E-Commerce-Marketing-Strategien und Enterprise-Lösungen – wir bieten professionelle, zertifizierte und premium Marketingdienstleistungen für jede Anforderung.
              </p>
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {categories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${category.color}`}>
                        {category.icon}
                      </div>
                      <CardTitle className="text-xl leading-tight">{category.title}</CardTitle>
                    </div>
                    <CardDescription className="text-gray-600">{category.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-blue-50" asChild>
                      <Link href={localizeHref(category.href)}>
                        <span>Mehr erfahren</span>
                        <ArrowLongRightIcon className="h-5 w-5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Platform Features Section - Now renamed to Solutions */}
      <section id="solutions" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-indigo-100 text-indigo-800 border-indigo-200">Technologie-gestützte Lösungen</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Innovative Marketing-Technologie für Ihren Wettbewerbsvorteil</h2>
            <p className="text-gray-600 text-lg mb-6">
              Unsere technologischen Lösungen vereinen Marketing-Expertise mit technischem Know-how. 
              Von individualisierbaren API-Schnittstellen bis hin zu automatisierten Workflows – 
              wir bieten innovative Ansätze für messbare Ergebnisse.
            </p>
            
            <div className="text-gray-600 max-w-3xl mx-auto text-left">
              <p className="mb-4">
                Technologie ist nicht einfach nur ein "Nice-to-have" bei uns – sie ist der Kern unseres Geschäftsmodells. Mit unserem vollständigen In-house IT-Team können wir Daten in praktisch jeder Form verarbeiten, maßgeschneiderte API-Verbindungen herstellen und Informationen extrahieren, die für andere Agenturen verborgen bleiben.
              </p>
              <p>
                Unsere DSGVO-konformen Cloud-Lösungen sind 100% made in Germany und bieten höchste Sicherheitsstandards bei gleichzeitiger Skalierbarkeit – ideal für mittelständische Unternehmen ebenso wie für internationale Konzerne im Rahmen ihrer digitalen Transformation. Wir übersetzen komplexe technische Möglichkeiten in wirksame Marketing-Strategien, die Ihren spezifischen Geschäftszielen dienen.
              </p>
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="h-full border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${feature.color}`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl leading-tight">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section with fixed Tab Navigation */}
      <section className="py-16 bg-white" id="services">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Digitales Marketing mit messbaren Ergebnissen</h2>
            <p className="text-lg text-gray-600">
              Wir kombinieren technisches Know-how mit datengetriebenem Marketing für maximalen ROI und nachweisbare Resultate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={localizeHref(service.href)}>
                  <Card className="h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <CardHeader>
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                      {service.icon}
                    </div>
                    <CardTitle>{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <CardDescription className="text-gray-600 mb-4">{service.description}</CardDescription>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {service.badges.map((badge, i) => (
                          <Badge key={i} variant="outline" className="bg-gray-50 text-gray-700">
                            {badge}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                    <CardFooter className="text-blue-600 flex items-center pt-2 text-sm">
                      <span className="font-medium">{service.stats}</span>
                      <ArrowLongRightIcon className="ml-2 h-4 w-4" />
                    </CardFooter>
                </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Industries Section - Now with SVG graphics */}
      <section id="industries" className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-gray-800 text-gray-200 border-gray-700">Branchen-Expertise</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Spezialisierte Lösungen für Ihre Branche</h2>
            <p className="text-gray-300 text-lg mb-6">
              Jede Branche hat ihre eigenen Herausforderungen und Chancen im digitalen Marketing. 
              Unsere spezialisierten Teams verfügen über tiefgreifendes Branchen-Know-how und entwickeln 
              maßgeschneiderte Strategien, die auf Ihre spezifischen Anforderungen zugeschnitten sind.
            </p>
            
            <div className="text-gray-300 max-w-3xl mx-auto text-left">
              <p className="mb-4">
                Von B2B-Unternehmen und E-Commerce-Plattformen bis hin zu lokalen Dienstleistern, Enterprise-Kunden, IT & SaaS-Anbietern und Healthcare-Organisationen – wir verstehen die einzigartigen Dynamiken und Anforderungen jeder Branche. Diese Spezialisierung ermöglicht es uns, zielgerichtete Marketingstrategien zu entwickeln, die auf die spezifischen Bedürfnisse und Zielgruppen Ihres Marktes abgestimmt sind.
              </p>
              <p>
                Unsere branchenspezifischen Lösungen berücksichtigen regulatorische Anforderungen, Wettbewerbslandschaften und Kundenverhalten in Ihrem Sektor – sei es bei der lokalen SEO für standortbasierte Unternehmen, der E-Commerce-Optimierung für Online-Shops oder der Entwicklung komplexer B2B-Leadgenerierungsstrategien, die auf die längeren Entscheidungszyklen in diesem Bereich abgestimmt sind.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
        <Link 
                key={industry.name} 
                href={localizeHref(industry.href)}
                className="group relative rounded-xl overflow-hidden h-60"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                
                {/* Using the SVG component instead of an Image */}
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                  <industry.SvgComponent />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-xl font-bold mb-2">{industry.name}</h3>
                  <span className="text-sm text-gray-300 inline-flex items-center">
                    Mehr erfahren <ArrowLongRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Kundenstimmen</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Was unsere Kunden über uns sagen</h2>
            <p className="text-gray-600 text-lg mb-6">
              Erfahren Sie aus erster Hand, wie unsere Kunden durch unsere maßgeschneiderten 
              Marketinglösungen messbare Erfolge erzielen und ihre Geschäftsziele übertreffen.
            </p>
            
            <div className="text-gray-600 max-w-3xl mx-auto text-left">
              <p className="mb-4">
                Unsere Zusammenarbeit mit Unternehmen verschiedenster Größen und Branchen hat eins gemeinsam: Wir identifizieren die einzigartigen Herausforderungen jedes Kunden und entwickeln maßgeschneiderte Lösungen, die echte, messbare Ergebnisse liefern. Von der Steigerung des organischen Traffics durch professionelle Suchmaschinenoptimierung bis hin zur Automatisierung komplexer Marketing-Prozesse – wir helfen Unternehmen dabei, in der digitalen Welt erfolgreich zu sein.
              </p>
              <p>
                Die folgenden Stimmen unserer Kunden zeigen exemplarisch, wie wir durch die Kombination aus technischer Expertise, strategischem Marketing-Know-how und einem tiefen Verständnis für Daten echte Wettbewerbsvorteile schaffen und gleichzeitig die Kosten-Effizienz steigern konnten. Dabei bleiben wir stets unserem Prinzip treu: Transparenz, Ehrlichkeit und ein klarer Fokus auf den tatsächlichen Return on Investment.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic mb-6 line-clamp-6">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold break-words">{testimonial.author}</p>
                      <p className="text-sm text-gray-500 break-words">{testimonial.position}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href={localizeHref("/kundenstimmen")}>
                Alle Kundenstimmen ansehen
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Resources Section */}
      <section id="resources" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-purple-100 text-purple-800 border-purple-200">Wissen & Insights</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Kostenlose Resources & Expertenwissen</h2>
            <p className="text-gray-600 text-lg mb-6">
              Erweitern Sie Ihr Digital-Marketing-Know-how mit unseren praxisorientierten Guides, 
              Webinaren und Blog-Beiträgen – erstellt von unserem Expertenteam aus 30+ spezialisierten Marketern.
            </p>
            
            <div className="text-gray-600 max-w-3xl mx-auto text-left">
              <p className="mb-4">
                Wir teilen unser gesammeltes Wissen aus 25 Jahren an der Schnittstelle zwischen Marketing und IT in Form von tiefgreifenden, praxisorientierten Ressourcen. Von detaillierten Whitepapers zu Tracking-Lösungen und Conversion-Optimierung bis hin zu Webinaren über Marketing-Automatisierung und Social-Media-Strategien – unsere Inhalte bieten konkrete Handlungsempfehlungen und Einblicke in die neuesten Entwicklungen.
              </p>
              <p>
                Unsere Content-Strategie zielt darauf ab, Ihnen das nötige Know-how für fundierte Entscheidungen zu vermitteln – sei es zur Webseiten-Optimierung, zu DSGVO-konformen Analytics-Lösungen oder zu digitalen Werbestrategien. Als Digitale Marketingagentur stellen wir sicher, dass unsere Ressourcen sowohl für Marketing-Einsteiger als auch für erfahrene Profis wertvollen Input liefern.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <Card key={index} className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={resource.image}
                    alt={resource.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm">
                    {resource.category}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="break-words mb-3 text-xl leading-tight min-h-[3rem]">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{resource.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full justify-between" asChild>
                    <Link href={localizeHref(resource.href)}>
                      <span>{resource.category === "Blog" ? "Artikel lesen" : "Jetzt ansehen"}</span>
                      <ArrowLongRightIcon className="h-5 w-5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href={localizeHref("/resources")}>
                Alle Resources entdecken
        </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Updated to be more balanced */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <RocketLaunchIcon className="h-16 w-16 mx-auto mb-6 text-blue-300" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Bereit für messbare Marketing-Erfolge?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Vereinbaren Sie jetzt ein kostenloses Beratungsgespräch und erfahren Sie, 
              wie unsere individuellen Marketinglösungen Ihr Unternehmen voranbringen können.
            </p>
            
            <div className="text-blue-100 max-w-3xl mx-auto text-left mb-10">
              <p className="mb-4">
                In einem unverbindlichen Erstgespräch analysieren wir gemeinsam Ihre aktuellen Marketing-Aktivitäten, identifizieren verborgene Potenziale und zeigen auf, wo Ihre Online-Marketing-Strategie optimiert werden kann. Als zertifizierte Google Ads und SEO Agentur für Deutschland und den internationalen Markt entwickeln wir maßgeschneiderte Lösungen, die präzise auf Ihre Ziele abgestimmt sind.
              </p>
              <p>
                Unsere kostenlose Beratung umfasst einen ersten Blick auf Ihr aktuelles Tracking-Setup, eine Einschätzung Ihrer Website-Optimierung und konkrete Vorschläge, wie wir durch automatisierte, datengetriebene und DSGVO-konforme Marketingmaßnahmen gemeinsam Ihren Erfolg steigern können. Setzen Sie auf die Kombination aus technischer Präzision und strategischer Kreativität – für Marketing, das nachweisbar funktioniert.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Kostenlose Beratung vereinbaren
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                Services entdecken
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold">Warum OnlineMarketingCORE?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Alert className="bg-blue-50 border-blue-200">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
              <AlertTitle>DSGVO-konform</AlertTitle>
              <AlertDescription>
                Alle unsere Prozesse und Tools entsprechen den höchsten Datenschutzstandards. 100% Made in Germany.
              </AlertDescription>
            </Alert>
            <Alert className="bg-green-50 border-green-200">
              <ChartPieIcon className="h-5 w-5 text-green-600" />
              <AlertTitle>Nachweisbare Ergebnisse</AlertTitle>
              <AlertDescription>
                Transparente Berichterstattung und messbare Performance-Steigerungen durch präzises Tracking.
              </AlertDescription>
            </Alert>
            <Alert className="bg-purple-50 border-purple-200">
              <UserGroupIcon className="h-5 w-5 text-purple-600" />
              <AlertTitle>Experten-Team</AlertTitle>
              <AlertDescription>
                30+ spezialisierte Marketing-Teams mit einzigartigem technischem Know-how für maximalen Erfolg.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* Fixed Tab Navigation */}
      <div className="sticky bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg py-2">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center">
              <TabsList className="w-full max-w-3xl grid grid-cols-6 gap-1">
                <TabsTrigger value="all" className="flex flex-col items-center justify-center h-16 space-y-1">
                  <GlobeAltIcon className="h-5 w-5" />
                  <span className="text-xs text-center">Alle Services</span>
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex flex-col items-center justify-center h-16 space-y-1">
                  <GlobeAltIcon className="h-5 w-5" />
                  <span className="text-xs text-center">SEO</span>
                </TabsTrigger>
                <TabsTrigger value="ads" className="flex flex-col items-center justify-center h-16 space-y-1">
                  <ChartBarIcon className="h-5 w-5" />
                  <span className="text-xs text-center">Google Ads</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex flex-col items-center justify-center h-16 space-y-1">
                  <DocumentTextIcon className="h-5 w-5" />
                  <span className="text-xs text-center">Content</span>
                </TabsTrigger>
                <TabsTrigger value="automation" className="flex flex-col items-center justify-center h-16 space-y-1">
                  <CogIcon className="h-5 w-5" />
                  <span className="text-xs text-center">Automation</span>
                </TabsTrigger>
                <TabsTrigger value="platform" className="flex flex-col items-center justify-center h-16 space-y-1">
                  <ServerIcon className="h-5 w-5" />
                  <span className="text-xs text-center">CORE</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
} 