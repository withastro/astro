'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WebseitenEntwicklungHero } from '@/app/components/hero/WebseitenEntwicklungHero';
import { 
  Code2, 
  Globe, 
  Smartphone, 
  Layers, 
  Database, 
  Palette, 
  Lightbulb, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from 'lucide-react';

const entwicklungServices = [
  {
    title: "Custom Website Entwicklung",
    description: "Wir entwickeln individuelle Websites, die perfekt auf Ihre Marke und Geschäftsziele abgestimmt sind. Von der Konzeption über das Design bis zur Programmierung – wir realisieren Ihre digitale Präsenz nach Maß.",
    icon: <Palette className="h-10 w-10" />,
    benefits: ["Einzigartiges Design", "Maßgeschneiderte Funktionen", "Optimale User Experience"],
    image: "/images/webseiten-entwicklung/custom.jpg",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    title: "E-Commerce Lösungen",
    description: "Wir entwickeln leistungsstarke Online-Shops, die Verkäufe fördern und das Einkaufserlebnis optimieren. Mit benutzerfreundlichen Funktionen und sicheren Zahlungslösungen steigern wir Ihren Online-Umsatz.",
    icon: <Globe className="h-10 w-10" />,
    benefits: ["Shopify", "WooCommerce", "Individuelle Shop-Lösungen"],
    image: "/images/webseiten-entwicklung/ecommerce.jpg",
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    title: "Web Applikationen",
    description: "Wir entwickeln komplexe Webanwendungen, die Ihre Geschäftsprozesse digitalisieren und optimieren. Von internen Tools bis zu kundenorientierten Plattformen – wir schaffen digitale Lösungen mit echtem Mehrwert.",
    icon: <Code2 className="h-10 w-10" />,
    benefits: ["React", "Next.js", "Vue.js", "Node.js"],
    image: "/images/webseiten-entwicklung/webapp.jpg",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    title: "CMS Implementierung",
    description: "Wir implementieren benutzerfreundliche Content-Management-Systeme, die es Ihnen ermöglichen, Ihre Website selbstständig zu pflegen und zu aktualisieren. Intuitiv, flexibel und anpassbar an Ihre Bedürfnisse.",
    icon: <Layers className="h-10 w-10" />,
    benefits: ["WordPress", "TYPO3", "Headless CMS"],
    image: "/images/webseiten-entwicklung/cms.jpg",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    title: "Responsive Websites",
    description: "Wir entwickeln responsive Websites, die auf allen Geräten perfekt funktionieren – von Smartphones über Tablets bis hin zu Desktop-Computern. Für ein optimales Nutzererlebnis auf jedem Screen.",
    icon: <Smartphone className="h-10 w-10" />,
    benefits: ["Mobile First", "Progressive Web Apps", "Adaptive Design"],
    image: "/images/webseiten-entwicklung/responsive.jpg",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    title: "Website Wartung",
    description: "Wir übernehmen die kontinuierliche Pflege und Wartung Ihrer Website. Von regelmäßigen Updates über Sicherheits-Audits bis hin zu Content-Updates – wir sorgen dafür, dass Ihre Website stets optimal performt.",
    icon: <ShieldCheck className="h-10 w-10" />,
    benefits: ["Sicherheits-Updates", "Backup-Management", "Performance-Monitoring"],
    image: "/images/webseiten-entwicklung/maintenance.jpg",
    color: "bg-green-50 text-green-700 border-green-200"
  }
];

const technologien = [
  {
    title: "Frontend-Technologien",
    icon: <Code2 className="h-8 w-8" />,
    items: ["HTML5 & CSS3", "JavaScript & TypeScript", "React & Next.js", "Vue.js & Nuxt.js", "TailwindCSS & SCSS"]
  },
  {
    title: "Backend-Technologien",
    icon: <Database className="h-8 w-8" />,
    items: ["Node.js & Express", "PHP & Laravel", "Python & Django", "REST & GraphQL APIs", "Datenbank-Systeme"]
  },
  {
    title: "CMS & E-Commerce",
    icon: <Layers className="h-8 w-8" />,
    items: ["WordPress & TYPO3", "Shopify & WooCommerce", "Contentful", "Storyblok", "Strapi"]
  },
  {
    title: "Design & UX",
    icon: <Palette className="h-8 w-8" />,
    items: ["UI/UX Design", "Wireframing & Prototyping", "Responsive Design", "Barrierefreiheit", "Design-Systeme"]
  }
];

const processSteps = [
  {
    step: 1,
    title: "Analyse & Konzeption",
    description: "Wir analysieren Ihre Anforderungen, Zielgruppen und Geschäftsziele. Gemeinsam erarbeiten wir ein umfassendes Konzept für Ihre Webpräsenz, das als Grundlage für alle weiteren Schritte dient.",
    color: "bg-blue-500"
  },
  {
    step: 2,
    title: "Design & Prototyping",
    description: "Wir gestalten das visuelle Erscheinungsbild Ihrer Website und erstellen interaktive Prototypen. So können Sie frühzeitig die Benutzeroberfläche erleben und Feedback geben.",
    color: "bg-pink-500"
  },
  {
    step: 3,
    title: "Entwicklung & Programmierung",
    description: "Unsere erfahrenen Entwickler setzen das Design in Code um und implementieren alle gewünschten Funktionen. Wir arbeiten nach modernsten Entwicklungsstandards für optimale Performance und Sicherheit.",
    color: "bg-purple-500"
  },
  {
    step: 4,
    title: "Testing & Qualitätssicherung",
    description: "Wir testen Ihre Website gründlich auf allen relevanten Geräten und Browsern. Funktionale Tests, Performance-Checks und Sicherheits-Audits garantieren höchste Qualität.",
    color: "bg-indigo-500"
  },
  {
    step: 5,
    title: "Launch & Betreuung",
    description: "Nach dem erfolgreichen Launch betreuen wir Ihre Website kontinuierlich. Wir kümmern uns um Updates, Sicherheit, Backups und stehen für Erweiterungen und Optimierungen zur Verfügung.",
    color: "bg-green-500"
  }
];

export default function WebseitenEntwicklungPage() {
  const params = usePathname();
  const locale = params.locale as string || 'de';

  return (
    <main className="min-h-screen">
      {/* Hero Section with Slider */}
      <WebseitenEntwicklungHero />

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Unsere Webentwicklungs-Services</h2>
          <p className="text-gray-600">
            Wir bieten das gesamte Spektrum der professionellen Webentwicklung – 
            von maßgeschneiderten Websites über E-Commerce-Lösungen bis hin zu komplexen Webanwendungen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {entwicklungServices.map((service, index) => (
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

      {/* Technologies Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Technologien</Badge>
            <h2 className="text-3xl font-bold mb-6">Moderne Technologien für zukunftssichere Lösungen</h2>
            <p className="text-gray-600">
              Wir arbeiten mit den neuesten Technologien und Frameworks, um skalierbare, sichere und 
              performante Weblösungen zu entwickeln.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technologien.map((tech, index) => (
              <motion.div
                key={tech.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">
                  {tech.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{tech.title}</h3>
                <ul className="space-y-2">
                  {tech.items.map((item, idx) => (
                    <li key={idx} className="text-gray-600 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Unser Prozess</Badge>
          <h2 className="text-3xl font-bold mb-6">Von der Idee zur fertigen Website</h2>
          <p className="text-gray-600">
            Unser bewährter Entwicklungsprozess sorgt für effiziente Projektumsetzung, Termintreue 
            und höchste Qualitätsstandards.
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

      {/* Portfolio Section */}
      <section className="bg-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Portfolio</Badge>
            <h2 className="text-3xl font-bold mb-6">Unsere erfolgreichen Projekte</h2>
            <p className="text-gray-600">
              Entdecken Sie eine Auswahl unserer erfolgreich umgesetzten Webprojekte 
              aus verschiedenen Branchen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">Projektbeispiel {index + 1}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Website-Projekt</h3>
                  <p className="text-gray-600 mb-4">
                    Beschreibung des Projekts. Hier folgt eine kurze Erläuterung der Anforderungen und umgesetzten Lösungen.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'TailwindCSS', 'Next.js'].map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href={`/${locale}/portfolio`}>
              <Button variant="outline" className="bg-white border-blue-500 text-blue-700 hover:bg-blue-50">
                Alle Projekte ansehen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
            <h2 className="text-3xl font-bold mb-6">Bereit für Ihr Webprojekt?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Lassen Sie uns gemeinsam Ihre Ideen in die digitale Welt bringen. 
              Kontaktieren Sie uns für ein unverbindliches Beratungsgespräch.
            </p>
            <Link href={`/${locale}/kontakt`}>
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Unverbindliches Angebot anfordern
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 