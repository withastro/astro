'use client';

import { TeamHero } from '@/app/components/hero/TeamHero';
import { TeamMemberCard, TeamMemberProps } from '@/app/components/cards/TeamMemberCard';
import { motion } from 'framer-motion';
import { UsersIcon, BriefcaseIcon, AcademicCapIcon, TrophyIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

// Define team members by department
const departmentMembers: {
  [key: string]: TeamMemberProps[];
} = {
  leadership: [
    {
      name: "Dr. Andreas Weber",
      role: "Gründer & CEO",
      department: "Führung",
      bio: "Gründer und visionärer Kopf hinter OnlineMarketingCORE mit über 25 Jahren Erfahrung in der digitalen Transformation. Dr. Weber verbindet technische Innovation mit strategischem Marketing.",
      image: "/images/team/andreas-weber.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      },
      expertise: ["Digitale Strategie", "Technologische Innovation", "Unternehmensentwicklung"]
    },
    {
      name: "Sarah Becker",
      role: "CTO",
      department: "Führung",
      bio: "Mit einem Hintergrund in Softwareentwicklung und maschinellem Lernen leitet Sarah die technische Entwicklung und sorgt für die nahtlose Integration von IT und Marketing.",
      image: "/images/team/sarah-becker.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        website: "https://example.com"
      },
      expertise: ["Systemarchitektur", "API-Entwicklung", "Data Engineering"]
    },
    {
      name: "Markus Hoffmann",
      role: "COO",
      department: "Führung",
      bio: "Verantwortlich für die operativen Abläufe und Prozessoptimierung. Markus sorgt dafür, dass technische Innovationen in effiziente Arbeitsabläufe umgesetzt werden.",
      image: "/images/team/markus-hoffmann.jpg",
      socials: {
        linkedin: "https://linkedin.com"
      },
      expertise: ["Prozessoptimierung", "Projektmanagement", "Qualitätssicherung"]
    }
  ],
  seo: [
    {
      name: "Michael Schmidt",
      role: "Head of SEO",
      department: "SEO",
      bio: "Spezialist für technische SEO mit besonderem Fokus auf automatisierte Optimierungsprozesse und datengetriebene Strategien.",
      image: "/images/team/michael-schmidt.jpg",
      socials: {
        twitter: "https://twitter.com"
      },
      expertise: ["Technisches SEO", "SEO-Automatisierung", "Content-Strategie"]
    },
    {
      name: "Julia Weber",
      role: "Senior SEO Strategist",
      department: "SEO",
      bio: "Entwickelt maßgeschneiderte SEO-Strategien für verschiedene Branchen und koordiniert die Umsetzung mit Content- und Development-Teams.",
      image: "/images/team/julia-weber.jpg",
      socials: {
        linkedin: "https://linkedin.com"
      },
      expertise: ["SEO-Audits", "Keyword-Recherche", "Lokales SEO"]
    },
    {
      name: "Thomas Krause",
      role: "Technical SEO Specialist",
      department: "SEO",
      bio: "Experte für technische SEO-Implementierungen, Website-Strukturen und Crawler-Optimierung mit tiefem Verständnis für Webentwicklung.",
      image: "/images/team/thomas-krause.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        website: "https://example.com"
      },
      expertise: ["Crawlability", "Indexierung", "Core Web Vitals"]
    }
  ],
  content: [
    {
      name: "Laura Schneider",
      role: "Head of Content",
      department: "Content",
      bio: "Kreative Strategin mit einem Hintergrund in Journalismus und digitalem Marketing. Laura verbindet SEO-Anforderungen mit überzeugendem Storytelling.",
      image: "/images/team/laura-schneider.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      },
      expertise: ["Content-Strategie", "Storytelling", "SEO-Content"]
    },
    {
      name: "Daniel Müller",
      role: "Senior Content Creator",
      department: "Content",
      bio: "Verfasst überzeugende Inhalte für verschiedene Branchen und Zielgruppen mit besonderem Fokus auf technisch anspruchsvolle Themen.",
      image: "/images/team/daniel-mueller.jpg",
      socials: {
        twitter: "https://twitter.com"
      },
      expertise: ["B2B-Content", "Technische Dokumentation", "Whitepaper"]
    }
  ],
  analytics: [
    {
      name: "Christian Klein",
      role: "Head of Analytics",
      department: "Analytics",
      bio: "Datenexperte mit Spezialisierung auf Conversion-Optimierung und Customer Journey Analyse. Christian entwickelt maßgeschneiderte Tracking-Lösungen für komplexe Anforderungen.",
      image: "/images/team/christian-klein.jpg",
      socials: {
        linkedin: "https://linkedin.com"
      },
      expertise: ["Google Analytics", "Attribution", "A/B-Testing"]
    },
    {
      name: "Sophia Wagner",
      role: "Data Scientist",
      department: "Analytics",
      bio: "Mit einem Hintergrund in Statistik und maschinellem Lernen transformiert Sophia komplexe Daten in umsetzbare Marketing-Insights.",
      image: "/images/team/sophia-wagner.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        website: "https://example.com"
      },
      expertise: ["Predictive Analytics", "Machine Learning", "Datenvisualisierung"]
    }
  ],
  development: [
    {
      name: "Felix Bauer",
      role: "Lead Developer",
      department: "Entwicklung",
      bio: "Full-Stack-Entwickler mit Fokus auf Marketing-Technologien und API-Integrationen. Felix leitet die Entwicklung der CORE-Plattform.",
      image: "/images/team/felix-bauer.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        github: "https://github.com"
      },
      expertise: ["Full-Stack", "API-Entwicklung", "Marketing Tech"]
    },
    {
      name: "Nina Hartmann",
      role: "Frontend Developer",
      department: "Entwicklung",
      bio: "Spezialisiert auf reaktionsschnelle, benutzerfreundliche Interfaces mit besonderem Augenmerk auf Performance und Usability.",
      image: "/images/team/nina-hartmann.jpg",
      socials: {
        linkedin: "https://linkedin.com"
      },
      expertise: ["React", "TypeScript", "UI/UX"]
    },
    {
      name: "Max Fischer",
      role: "Backend Developer",
      department: "Entwicklung",
      bio: "Entwickelt skalierbare und sichere Backend-Lösungen für Marketing-Automatisierung und Datenverarbeitung.",
      image: "/images/team/max-fischer.jpg",
      socials: {
        linkedin: "https://linkedin.com",
        github: "https://github.com"
      },
      expertise: ["Node.js", "Python", "Microservices"]
    }
  ]
};

// Company values
const companyValues = [
  {
    title: "Technologische Exzellenz",
    description: "Wir streben kontinuierlich nach innovativen Lösungen und technischer Perfektion, um komplexe Probleme elegant zu lösen.",
    icon: <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
  },
  {
    title: "Datenintegrität",
    description: "Unsere Entscheidungen basieren auf präzisen, transparenten Daten – nicht auf Annahmen oder ungeprüften Behauptungen.",
    icon: <TrophyIcon className="h-6 w-6 text-green-600" />
  },
  {
    title: "Kontinuierliches Lernen",
    description: "Wir fördern eine Kultur des ständigen Lernens und der Weiterentwicklung, um an der Spitze unserer sich schnell verändernden Branche zu bleiben.",
    icon: <AcademicCapIcon className="h-6 w-6 text-purple-600" />
  },
  {
    title: "Kreative Problemlösung",
    description: "Wir kombinieren kreatives Denken mit analytischer Präzision, um innovative Lösungen für komplexe Marketingherausforderungen zu entwickeln.",
    icon: <BriefcaseIcon className="h-6 w-6 text-amber-600" />
  },
  {
    title: "Teamwork & Synergie",
    description: "Unsere interdisziplinären Teams arbeiten nahtlos zusammen, um die Stärken von IT und Marketing zu vereinen und optimale Ergebnisse zu erzielen.",
    icon: <UsersIcon className="h-6 w-6 text-red-600" />
  }
];

// Career benefits
const careerBenefits = [
  {
    title: "Flexible Arbeitszeiten",
    description: "Mit unserem Modell aus Kernarbeitszeiten und flexiblen Stunden kannst du deinen Arbeitsrhythmus an deine persönlichen Bedürfnisse anpassen."
  },
  {
    title: "Remote & Hybrid Work",
    description: "Arbeite von überall – wir bieten vollständige Remote-Optionen oder hybride Modelle mit gelegentlicher Präsenz im Büro."
  },
  {
    title: "Kontinuierliche Weiterbildung",
    description: "Regelmäßige interne Schulungen, Budget für externe Kurse und Konferenzen sowie Zugang zu unserer umfangreichen digitalen Bibliothek."
  },
  {
    title: "Moderne Technologiestack",
    description: "Arbeite mit den neuesten Technologien und Tools, um innovative Lösungen zu entwickeln und deine technischen Fähigkeiten zu erweitern."
  },
  {
    title: "Work-Life-Balance",
    description: "30 Tage Urlaub, Mental Health Days und regelmäßige Teamevents sorgen für eine gesunde Balance zwischen Arbeit und Privatleben."
  },
  {
    title: "Karriereentwicklung",
    description: "Individuelle Entwicklungspläne, regelmäßiges Feedback und transparente Aufstiegsmöglichkeiten unterstützen deine berufliche Weiterentwicklung."
  }
];

export default function TeamPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  const localizeHref = (href: string) => {
    if (href.startsWith('/')) {
      return `/${locale}${href}`;
    }
    return href;
  };

  // Get all departments
  const departments = Object.keys(departmentMembers);

  return (
    <div>
      {/* Hero Section */}
      <TeamHero />

      {/* Team Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Unsere Unternehmenswerte
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Diese Grundsätze prägen unsere Arbeit und definieren, wie wir Herausforderungen angehen
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companyValues.map((value, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="mb-4 p-3 inline-block rounded-full bg-gray-100">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section id="experts" className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Lernen Sie unser Team kennen
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Bei OnlineMarketingCORE arbeiten 30 Experten mit verschiedenen Hintergründen und Spezialgebieten. Hier sind einige Schlüsselmitglieder unseres Teams.
            </motion.p>
          </div>

          <Tabs defaultValue="leadership" className="mb-12">
            <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-5 max-w-3xl mx-auto mb-8">
              {departments.map((dept) => (
                <TabsTrigger key={dept} value={dept} className="capitalize">
                  {dept === "leadership" ? "Führung" : 
                   dept === "seo" ? "SEO" : 
                   dept === "content" ? "Content" : 
                   dept === "analytics" ? "Analytics" : 
                   dept === "development" ? "Entwicklung" : dept}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {departments.map((dept) => (
              <TabsContent key={dept} value={dept}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {departmentMembers[dept].map((member, index) => (
                    <TeamMemberCard 
                      key={member.name} 
                      {...member} 
                      delay={index}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Join Our Team Section */}
      <section className="py-16 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Werden Sie Teil unseres Teams
            </motion.h2>
            <motion.p 
              className="text-xl text-blue-200 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Wir suchen ständig nach talentierten Menschen, die unsere Leidenschaft für digitale Exzellenz teilen. Entdecken Sie, was eine Karriere bei OnlineMarketingCORE zu bieten hat.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href={localizeHref("/careers")}>
                <Button size="lg" variant="secondary" className="mb-12">
                  Offene Stellen ansehen
                </Button>
              </Link>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careerBenefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <h3 className="text-xl font-bold mb-2 text-blue-200">{benefit.title}</h3>
                <p className="text-gray-200">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              OnlineMarketingCORE in Zahlen
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Fakten, die unsere Expertise und Position als führende Digitalagentur unterstreichen
            </motion.p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">25+</div>
              <div className="text-gray-600">Jahre Erfahrung</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">30</div>
              <div className="text-gray-600">Team-Mitglieder</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">200+</div>
              <div className="text-gray-600">Zufriedene Kunden</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">8</div>
              <div className="text-gray-600">Sprachregionen</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Häufig gestellte Fragen
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Antworten auf die häufigsten Fragen zu unserer Arbeit und unserem Team
            </motion.p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <motion.div 
                className="bg-white rounded-xl shadow-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">Was unterscheidet OnlineMarketingCORE von anderen Agenturen?</h3>
                <p className="text-gray-600">Unsere einzigartige Kombination aus tiefem technischen Know-how und strategischem Marketing-Verständnis. Während viele Agenturen sich auf einen Aspekt konzentrieren, integrieren wir beide Welten nahtlos. Unsere proprietäre CORE-Plattform und interne Entwicklungsteams ermöglichen Automatisierungen und Datenanalysen, die über Standard-Agenturangebote weit hinausgehen.</p>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl shadow-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">Wie arbeiten die verschiedenen Teams zusammen?</h3>
                <p className="text-gray-600">Wir praktizieren ein integriertes Teammodell, bei dem SEO, Content, Analytics und Entwicklung eng zusammenarbeiten. Jeder Kunde hat einen festen Ansprechpartner, der alle Disziplinen koordiniert. Unsere internen Kommunikationsstrukturen und Projektmanagement-Tools ermöglichen effiziente Zusammenarbeit ohne Silodenken.</p>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl shadow-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">Wie sieht der Bewerbungsprozess bei OnlineMarketingCORE aus?</h3>
                <p className="text-gray-600">Unser Bewerbungsprozess umfasst typischerweise ein initiales Screening, ein Fachgespräch und ein Kulturinterview. Bei technischen Positionen kann auch eine praktische Aufgabe Teil des Prozesses sein. Wir legen besonderen Wert auf Problemlösungsfähigkeiten, kontinuierliche Lernbereitschaft und Teamgeist – nicht nur auf formale Qualifikationen.</p>
              </motion.div>
            </div>
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
            <h2 className="text-3xl font-bold mb-4">Bereit für ein persönliches Gespräch?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Kontaktieren Sie uns für eine kostenlose Beratung und erfahren Sie, wie unser Team Ihr digitales Marketing auf ein neues Level heben kann.
            </p>
            <Link href={localizeHref("/contact/consultation")}>
              <Button size="lg" variant="secondary">
                Jetzt Beratungstermin vereinbaren
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 