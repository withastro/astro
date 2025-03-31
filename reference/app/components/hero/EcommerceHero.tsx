'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart, ChevronRight, CreditCard, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

const slides = [
  {
    title: "E-Commerce Marketing",
    description: "Steigern Sie Ihren Online-Shop Umsatz mit datengetriebenen Marketing-Strategien",
    icon: <ShoppingCart className="h-12 w-12 text-blue-600" />,
    stats: "Ø 45% mehr Conversion",
    color: "from-blue-500/20 to-transparent"
  },
  {
    title: "Performance Marketing",
    description: "Maximieren Sie Ihren ROI durch gezielte Werbekampagnen und Conversion-Optimierung",
    icon: <TrendingUp className="h-12 w-12 text-green-600" />,
    stats: "Ø 32% niedrigere CPA",
    color: "from-green-500/20 to-transparent"
  },
  {
    title: "Datengetriebene Optimierung",
    description: "Nutzen Sie die Kraft von Analytics für fundierte Marketing-Entscheidungen",
    icon: <BarChart className="h-12 w-12 text-purple-600" />,
    stats: "100% Transparenz",
    color: "from-purple-500/20 to-transparent"
  }
];

export function EcommerceHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[600px] bg-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-100/50" />
      
      <div className="container mx-auto px-4 py-20 relative">
        <div className="max-w-4xl mx-auto">
          {slides.map((slide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: currentSlide === index ? 1 : 0,
                x: currentSlide === index ? 0 : 20,
              }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 ${currentSlide === index ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} -z-10`} />
              
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 inline-block"
                >
                  {slide.icon}
                </motion.div>
                
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl md:text-5xl font-bold mb-6"
                >
                  {slide.title}
                </motion.h1>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-xl text-gray-600 mb-8"
                >
                  {slide.description}
                </motion.p>
                
                {slide.stats && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-2xl font-semibold text-blue-600 mb-8"
                  >
                    {slide.stats}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          
          <div className="relative pt-80">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center gap-4"
            >
              <Link href="/beratungstermin">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Kostenlose Beratung
                </Button>
              </Link>
              <Link href="#services">
                <Button size="lg" variant="outline">
                  Unsere Leistungen
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Slide ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentSlide === index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 