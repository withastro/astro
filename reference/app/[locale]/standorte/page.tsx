'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPinIcon, 
  PhoneIcon, 
  MailIcon, 
  GlobeIcon,
  ClockIcon
} from 'lucide-react';
import Link from 'next/link';

// Directly import the SVG files, which will be processed by webpack
// Once processed, these will be available at the root of the application
import berlinSvg from '../../../public/images/standorte/berlin.svg';
import madridSvg from '../../../public/images/standorte/madrid.svg';
import milanSvg from '../../../public/images/standorte/milan.svg';
import parisSvg from '../../../public/images/standorte/paris.svg';
import warsawSvg from '../../../public/images/standorte/warsaw.svg';
import worldMapSvg from '../../../public/images/world-map.svg';

const offices = [
  {
    city: "Berlin",
    country: "Deutschland",
    address: "Musterstraße 123, 10115 Berlin",
    phone: "+49 30 12345678",
    email: "berlin@onlinemarketingcore.de",
    hours: "Mo-Fr: 09:00 - 18:00 Uhr",
    image: berlinSvg.src,
    description: "Unser Hauptsitz in Berlin ist das Zentrum unserer Innovationen und technischen Entwicklung. Hier arbeiten unsere spezialisierten Teams an zukunftsweisenden Lösungen für digitales Marketing und Automatisierung.",
    features: ["Hauptsitz", "30+ Experten", "Eigenes Entwicklungsteam"],
    mapUrl: "https://maps.google.com/?q=Berlin,Germany"
  },
  {
    city: "Madrid",
    country: "Spanien",
    address: "Calle de Ejemplo 45, 28001 Madrid",
    phone: "+34 91 2345678",
    email: "madrid@onlinemarketingcore.com",
    hours: "Lu-Vi: 09:00 - 18:00",
    image: madridSvg.src,
    description: "Unser Büro in Madrid betreut den spanischen und lateinamerikanischen Markt mit lokalisierten Marketingstrategien und spezifischen Branchenkenntnissen für die Region.",
    features: ["Spanien-Hub", "SEO-Spezialisierung", "Latein-Amerika Expertise"],
    mapUrl: "https://maps.google.com/?q=Madrid,Spain"
  },
  {
    city: "Mailand",
    country: "Italien",
    address: "Via Esempio 78, 20121 Milano",
    phone: "+39 02 12345678",
    email: "milano@onlinemarketingcore.com",
    hours: "Lu-Ve: 09:00 - 18:00",
    image: milanSvg.src,
    description: "Unser Mailänder Büro bietet maßgeschneiderte Marketinglösungen für den italienischen Markt mit Fokus auf E-Commerce und Luxusbranding für die starke regionale Modeindustrie.",
    features: ["Italien-Zentrum", "E-Commerce Expertise", "Luxusmarken Spezialisierung"],
    mapUrl: "https://maps.google.com/?q=Milan,Italy"
  },
  {
    city: "Paris",
    country: "Frankreich",
    address: "Rue d'Exemple 123, 75001 Paris",
    phone: "+33 1 23456789",
    email: "paris@onlinemarketingcore.com",
    hours: "Lu-Ve: 09:00 - 18:00",
    image: parisSvg.src,
    description: "Unser Pariser Büro kombiniert kreative Strategien mit analytischem Marketing für den französischsprachigen Markt und bietet besondere Expertise in Luxus- und Retail-Marketing.",
    features: ["Frankreich-Hub", "Kreativ-Team", "DSGVO-Expertise"],
    mapUrl: "https://maps.google.com/?q=Paris,France"
  },
  {
    city: "Warschau",
    country: "Polen",
    address: "Ulica Przykładowa 56, 00-001 Warszawa",
    phone: "+48 22 1234567",
    email: "warszawa@onlinemarketingcore.com",
    hours: "Pon-Pią: 09:00 - 18:00",
    image: warsawSvg.src,
    description: "Unser Büro in Warschau ist auf die dynamischen Märkte Osteuropas spezialisiert und bietet technologische Innovation und Entwicklerexpertise für digitale Transformation.",
    features: ["Osteuropa-Hub", "Tech-Expertise", "Entwicklungszentrum"],
    mapUrl: "https://maps.google.com/?q=Warsaw,Poland"
  }
];

export default function StandortePage() {
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
          <Badge className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">Global präsent</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Unsere Standorte</h1>
          <p className="text-xl text-gray-600">
            OnlineMarketingCORE ist mit Niederlassungen in ganz Europa vertreten, um Ihnen lokalisierte und maßgeschneiderte Marketing-Strategien zu bieten.
          </p>
        </motion.div>
      </section>

      {/* Global Presence Section */}
      <section className="bg-gray-50 py-20 mb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">Internationale Expertise, lokale Umsetzung</h2>
              <p className="text-gray-600 mb-4">
                Mit unseren strategisch platzierten Standorten in ganz Europa verbinden wir globales 
                Marketing-Know-how mit tiefem Verständnis für lokale Märkte und Kulturen.
              </p>
              <p className="text-gray-600 mb-4">
                Jeder Standort ist mit spezialisierten Teams ausgestattet, die die Sprache und 
                Besonderheiten ihrer Region verstehen und Ihre Marketingstrategien entsprechend 
                anpassen.
              </p>
              <p className="text-gray-600">
                Diese internationale Präsenz ermöglicht es uns, länderübergreifende Kampagnen 
                nahtlos zu koordinieren und gleichzeitig die kulturellen Nuancen zu berücksichtigen, 
                die für erfolgreiche Lokalisierung entscheidend sind.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px] rounded-lg overflow-hidden"
            >
              <img
                src={worldMapSvg.src}
                alt="Unsere globale Präsenz"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-blue-900/30 mix-blend-multiply"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Unsere Büros in Europa</h2>
          <p className="text-gray-600">
            Entdecken Sie unsere strategisch positionierten Standorte, die es uns ermöglichen, 
            lokalisierte Marketingstrategien mit globalem Know-how zu verbinden.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offices.map((office, index) => (
            <motion.div
              key={office.city}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full">
                  <img
                    src={office.image}
                    alt={`${office.city}, ${office.country}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-2xl font-bold">{office.city}</h3>
                    <p className="text-blue-300">{office.country}</p>
                  </div>
                </div>
                
                <CardContent className="pt-6 flex-grow">
                  <p className="text-gray-700 mb-4">{office.description}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{office.address}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <a href={`tel:${office.phone}`} className="hover:text-blue-700">{office.phone}</a>
                    </div>
                    <div className="flex items-center">
                      <MailIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <a href={`mailto:${office.email}`} className="hover:text-blue-700">{office.email}</a>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                      <span>{office.hours}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {office.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <a 
                    href={office.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Auf Google Maps anzeigen
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Sprechen Sie mit uns</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Kontaktieren Sie unsere Experten an einem unserer Standorte für eine kostenlose Beratung 
            zu Ihren spezifischen Anforderungen.
          </p>
          <Link href={`/${locale}/kontakt`}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Kostenlose Beratung vereinbaren
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
} 