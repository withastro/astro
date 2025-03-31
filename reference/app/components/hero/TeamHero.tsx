'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  quote: string;
  image: string;
}

interface TeamHeroProps {
  title?: string;
  description?: string;
  cta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Dr. Andreas Weber",
    role: "Gründer & CEO",
    quote: "Mit über 25 Jahren Erfahrung in IT und Marketing haben wir eine einzigartige Schnittmenge geschaffen, die technologische Exzellenz mit strategischem Marketing verbindet.",
    image: "/images/team/andreas-weber.jpg"
  },
  {
    id: 2,
    name: "Sarah Becker",
    role: "CTO",
    quote: "Unsere technische Expertise ist nicht nur ein Zusatz – sie ist der Kern unseres Angebots und schafft Lösungen, die andere für unmöglich halten.",
    image: "/images/team/sarah-becker.jpg"
  },
  {
    id: 3,
    name: "Michael Schneider",
    role: "Head of SEO",
    quote: "Wir haben revolutionäre SEO-Automatisierungen implementiert, die kontinuierlich optimieren, was andere Agenturen manuell und sporadisch tun.",
    image: "/images/team/michael-schneider.jpg"
  },
  {
    id: 4,
    name: "Julia Hoffmann",
    role: "Head of Content",
    quote: "Datengetriebene Strategien kombiniert mit kreativem Storytelling ergeben Content, der nicht nur gefunden wird, sondern auch konvertiert.",
    image: "/images/team/julia-hoffmann.jpg"
  },
  {
    id: 5,
    name: "Thomas Müller",
    role: "Head of Data & Analytics",
    quote: "In unserer 25-jährigen Geschichte haben wir noch kein perfektes Tracking-System gesehen. Dies zu erkennen ist der erste Schritt zur Verbesserung.",
    image: "/images/team/thomas-mueller.jpg"
  }
];

export function TeamHero({ 
  title = "Unser Team — Experten an der Schnittstelle von IT und Marketing", 
  description = "Lernen Sie die Menschen kennen, die OnlineMarketingCORE zu einer der führenden Digitalagenturen in Deutschland gemacht haben. Ein Team aus Technologie-Enthusiasten, Marketing-Strategen und Datenanalysten, vereint durch die Leidenschaft für messbare Ergebnisse.",
  cta = { label: "Team kennenlernen", href: "/about/team#experts" },
  secondaryCta = { label: "Karriere bei uns", href: "/careers" }
}: TeamHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const params = useParams();
  const locale = params.locale as string || 'de';

  // Localize links
  const localizeHref = (href: string) => {
    if (href.startsWith('/')) {
      return `/${locale}${href}`;
    }
    return href;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1));
    setAutoplay(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1));
    setAutoplay(false);
  };

  // Autoplay
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 py-12 md:py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 800 800">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div className="text-white">
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="text-lg text-blue-200 mb-8 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {description}
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href={localizeHref(cta.href)}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {cta.label}
                </Button>
              </Link>
              
              <Link href={localizeHref(secondaryCta.href)}>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  {secondaryCta.label}
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* Slider */}
          <div className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-white/10 backdrop-blur-sm">
            {/* Slider Navigation */}
            <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2">
              <button 
                onClick={prevSlide}
                className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2">
              <button 
                onClick={nextSlide}
                className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Next slide"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Slides */}
            <div className="h-full w-full">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentIndex}
                  className="absolute inset-0 flex flex-col justify-end p-6 md:p-8"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  {/* Image */}
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${teamMembers[currentIndex].image})`,
                      opacity: 0.7 
                    }}
                  />
                  
                  {/* Text Overlay */}
                  <div className="relative z-10 text-white">
                    <motion.blockquote 
                      className="text-lg md:text-xl italic mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      "{teamMembers[currentIndex].quote}"
                    </motion.blockquote>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <h3 className="text-xl font-bold">{teamMembers[currentIndex].name}</h3>
                      <p className="text-blue-300">{teamMembers[currentIndex].role}</p>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
              {teamMembers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setAutoplay(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 