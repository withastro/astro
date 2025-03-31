'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ServicesHeroProps {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export function ServicesHero({ title, description, primaryCta, secondaryCta }: ServicesHeroProps) {
  return (
    <section className="relative bg-gray-100 py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-4"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl mb-8"
        >
          {description}
        </motion.p>
        <div className="flex justify-center gap-4">
          <Link href={primaryCta.href}>
            <Button variant="primary">{primaryCta.label}</Button>
          </Link>
          <Link href={secondaryCta.href}>
            <Button variant="outline">{secondaryCta.label}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
} 