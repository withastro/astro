'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { type Locale, type TranslationNamespace } from '@/app/i18n/config';

interface Service {
  title: string;
  description: string;
  icon: string;
  href: string;
}

interface HomeContentProps {
  locale: Locale;
  t: TranslationNamespace | null;
}

const defaultTranslations = {
  home: {
    hero: {
      title: 'Welcome',
      subtitle: 'Your Digital Partner',
      cta: 'Learn More'
    },
    services: {
      title: 'Our Services',
      learnMore: 'Learn More',
      items: {
        webDev: { 
          title: 'Web Development', 
          description: 'Modern web solutions' 
        },
        aiContent: { 
          title: 'AI Content', 
          description: 'Smart content solutions' 
        },
        dataAnalytics: { 
          title: 'Data Analytics', 
          description: 'Data-driven insights' 
        },
        graphicDesign: { 
          title: 'Graphic Design', 
          description: 'Creative designs' 
        }
      }
    },
    cta: {
      title: 'Ready to Start?',
      description: 'Let\'s work together',
      button: 'Contact Us'
    }
  }
};

export function AnimatedHomeContent({ locale, t }: HomeContentProps) {
  const translations = t?.home || defaultTranslations.home;
  
  const services: Service[] = [
    {
      title: translations.services.items.webDev.title,
      description: translations.services.items.webDev.description,
      icon: '🌐',
      href: `/${locale}/services/web-development`
    },
    {
      title: translations.services.items.aiContent.title,
      description: translations.services.items.aiContent.description,
      icon: '🤖',
      href: `/${locale}/services/ai-content`
    },
    {
      title: translations.services.items.dataAnalytics.title,
      description: translations.services.items.dataAnalytics.description,
      icon: '📊',
      href: `/${locale}/services/data-analytics`
    },
    {
      title: translations.services.items.graphicDesign.title,
      description: translations.services.items.graphicDesign.description,
      icon: '🎨',
      href: `/${locale}/services/graphic-design`
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            {translations.hero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
          >
            {translations.hero.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              href={`/${locale}/contact`}
              className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-full bg-white text-indigo-600 hover:bg-opacity-90 transition-all"
            >
              {translations.hero.cta}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">{translations.services.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <Link 
                  href={service.href}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                >
                  {translations.services.learnMore}
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{translations.cta.title}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {translations.cta.description}
          </p>
          <Link 
            href={`/${locale}/contact`}
            className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-full bg-white text-indigo-600 hover:bg-opacity-90 transition-all"
          >
            {translations.cta.button}
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </main>
  );
} 