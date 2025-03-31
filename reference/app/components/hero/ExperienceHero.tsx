'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ExperienceHeroProps {
  title?: string;
  description?: string;
  primaryAction?: {
    text: string;
    href: string;
  };
  secondaryAction?: {
    text: string;
    href: string;
  };
}

export function ExperienceHero({
  title = '25+ Jahre Erfahrung in digitaler Exzellenz',
  description = 'Als Pioniere im Online Marketing begleiten wir seit 1998 die digitale Transformation unserer Kunden. Mit tiefgreifender Expertise und innovativen Technologielösungen setzen wir Maßstäbe in der Branche.',
  primaryAction = {
    text: 'Beratungstermin vereinbaren',
    href: '/contact/consultation'
  },
  secondaryAction = {
    text: 'Unsere Fallstudien',
    href: '/case-studies'
  }
}: ExperienceHeroProps) {
  const params = useParams();
  const locale = params.locale as string || 'de';

  const localizeHref = (href: string) => {
    if (href.startsWith('/')) {
      return `/${locale}${href}`;
    }
    return href;
  };

  return (
    <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-white to-blue-50">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Content */}
          <div className="lg:w-1/2 lg:pr-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                {title}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={localizeHref(primaryAction.href)}>
                  <Button size="lg">{primaryAction.text}</Button>
                </Link>
                <Link href={localizeHref(secondaryAction.href)}>
                  <Button size="lg" variant="outline">{secondaryAction.text}</Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* SVG Visualization */}
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-full h-[400px]">
              <svg
                viewBox="0 0 500 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* Background gradient effect */}
                <defs>
                  <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>

                {/* Background shape */}
                <motion.path
                  d="M50,50 Q150,20 250,200 Q350,380 450,350"
                  stroke="url(#timelineGradient)"
                  strokeWidth="100"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Timeline connection line */}
                <motion.path
                  d="M50,200 Q150,180 250,200 Q350,220 450,200"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Year 1998 - Founded */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <circle cx="50" cy="200" r="20" fill="url(#circleGradient)" />
                  <text x="50" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">1998</text>
                  <text x="50" y="240" textAnchor="middle" fill="#1e3a8a" fontSize="10" fontWeight="bold">Gründung</text>
                </motion.g>

                {/* Year 2005 - Digital Transformation */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <circle cx="150" cy="200" r="20" fill="url(#circleGradient)" />
                  <text x="150" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">2005</text>
                  <text x="150" y="240" textAnchor="middle" fill="#1e3a8a" fontSize="10" fontWeight="bold">Digital</text>
                </motion.g>

                {/* Year 2012 - CORE Platform */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <circle cx="250" cy="200" r="25" fill="url(#circleGradient)" />
                  <text x="250" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">2012</text>
                  <text x="250" y="240" textAnchor="middle" fill="#1e3a8a" fontSize="10" fontWeight="bold">CORE Platform</text>
                </motion.g>

                {/* Year 2019 - European Expansion */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <circle cx="350" cy="200" r="20" fill="url(#circleGradient)" />
                  <text x="350" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">2019</text>
                  <text x="350" y="240" textAnchor="middle" fill="#1e3a8a" fontSize="10" fontWeight="bold">EU Expansion</text>
                </motion.g>

                {/* Year 2024 - AI Integration */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                >
                  <circle cx="450" cy="200" r="20" fill="url(#circleGradient)" />
                  <text x="450" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">2024</text>
                  <text x="450" y="240" textAnchor="middle" fill="#1e3a8a" fontSize="10" fontWeight="bold">KI Integration</text>
                </motion.g>

                {/* Connecting lines */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                >
                  <line x1="70" y1="195" x2="130" y2="195" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="170" y1="195" x2="225" y2="195" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="275" y1="195" x2="330" y2="195" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="370" y1="195" x2="430" y2="195" stroke="#3b82f6" strokeWidth="2" />
                </motion.g>

                {/* Decorative elements */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.7 }}
                >
                  <circle cx="250" cy="100" r="50" fill="url(#timelineGradient)" opacity="0.4" />
                  <text x="250" y="105" textAnchor="middle" fill="#1e3a8a" fontSize="16" fontWeight="bold">25+</text>
                  <text x="250" y="125" textAnchor="middle" fill="#1e3a8a" fontSize="10">Jahre Expertise</text>
                </motion.g>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 