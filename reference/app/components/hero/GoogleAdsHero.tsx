'use client';

import { motion } from 'framer-motion';
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GoogleAdsHeroProps {
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

export function GoogleAdsHero({
  title = 'Google Ads Kampagnen mit messbarem ROI',
  description = 'Maximieren Sie Ihre Sichtbarkeit und Conversions mit datengetriebenen Google Ads Kampagnen. Unsere zertifizierten Experten optimieren Ihr Budget für höchste Rendite und messbare Ergebnisse.',
  primaryAction = {
    text: 'Kostenlose Analyse',
    href: '/contact/google-analyse'
  },
  secondaryAction = {
    text: 'Google Ads Leistungen',
    href: '#services'
  }
}: GoogleAdsHeroProps) {
  const params = usePathname();
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
      <div className="absolute inset-0 z-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="google-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#google-grid)" />
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
                <Link href={secondaryAction.href}>
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
                {/* Google Colors */}
                <defs>
                  <linearGradient id="googleBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4285F4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#4285F4" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="googleRed" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EA4335" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#EA4335" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="googleYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FBBC05" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FBBC05" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="googleGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34A853" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34A853" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Central Google Ads Logo */}
                <motion.g
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <circle cx="250" cy="200" r="75" fill="white" />
                  <circle cx="250" cy="200" r="70" fill="white" stroke="#E1E1E1" strokeWidth="2" />
                  <text x="250" y="180" textAnchor="middle" className="text-lg font-bold" fill="#4285F4">Google</text>
                  <text x="250" y="210" textAnchor="middle" className="text-lg font-bold" fill="#4285F4">Ads</text>
                </motion.g>

                {/* Search Ads Module */}
                <motion.g
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <circle cx="120" cy="150" r="40" fill="url(#googleBlue)" />
                  <text x="120" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Search</text>
                  <text x="120" y="165" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Ads</text>
                </motion.g>

                {/* Display Ads Module */}
                <motion.g
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <circle cx="250" cy="80" r="40" fill="url(#googleRed)" />
                  <text x="250" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Display</text>
                  <text x="250" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Ads</text>
                </motion.g>

                {/* Video Ads Module */}
                <motion.g
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <circle cx="380" cy="150" r="40" fill="url(#googleYellow)" />
                  <text x="380" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Video</text>
                  <text x="380" y="165" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Ads</text>
                </motion.g>

                {/* Shopping Ads Module */}
                <motion.g
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <circle cx="250" cy="320" r="40" fill="url(#googleGreen)" />
                  <text x="250" y="315" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Shopping</text>
                  <text x="250" y="335" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Ads</text>
                </motion.g>

                {/* Connection lines */}
                <motion.path
                  d="M 160 150 L 210 175"
                  stroke="#4285F4"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 1.2 }}
                />

                <motion.path
                  d="M 250 120 L 250 160"
                  stroke="#EA4335"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 1.2 }}
                />

                <motion.path
                  d="M 340 150 L 290 175"
                  stroke="#FBBC05"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 1.2 }}
                />

                <motion.path
                  d="M 250 240 L 250 280"
                  stroke="#34A853"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 1.2 }}
                />

                {/* Animated Data Points */}
                <motion.circle
                  cx="185"
                  cy="162"
                  r="4"
                  fill="#4285F4"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    cx: [160, 185, 210],
                    cy: [150, 162, 175]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />

                <motion.circle
                  cx="250"
                  cy="140"
                  r="4"
                  fill="#EA4335"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    cy: [120, 140, 160]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 1.7,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />

                <motion.circle
                  cx="315"
                  cy="162"
                  r="4"
                  fill="#FBBC05"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    cx: [340, 315, 290],
                    cy: [150, 162, 175]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 1.9,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />

                <motion.circle
                  cx="250"
                  cy="260"
                  r="4"
                  fill="#34A853"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    cy: [240, 260, 280]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 2.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />

                {/* ROI Indicator */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 2.3 }}
                >
                  <path d="M 400 260 L 440 260 L 440 320 L 400 320 Z" fill="#4285F4" fillOpacity="0.2" />
                  <path d="M 370 280 L 410 280 L 410 320 L 370 320 Z" fill="#EA4335" fillOpacity="0.2" />
                  <path d="M 340 240 L 380 240 L 380 320 L 340 320 Z" fill="#FBBC05" fillOpacity="0.2" />
                  <path d="M 310 270 L 350 270 L 350 320 L 310 320 Z" fill="#34A853" fillOpacity="0.2" />
                  
                  <line x1="300" y1="320" x2="450" y2="320" stroke="#777" strokeWidth="1" />
                  <line x1="300" y1="320" x2="300" y2="220" stroke="#777" strokeWidth="1" />
                  
                  <motion.path 
                    d="M 300 300 L 320 280 L 340 260 L 360 290 L 380 270 L 400 250 L 420 240" 
                    stroke="#4285F4" 
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 2.5 }}
                  />
                  
                  <text x="375" y="220" textAnchor="middle" fill="#555" fontSize="10" fontWeight="bold">ROI</text>
                </motion.g>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 