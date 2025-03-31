'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function PerformanceOptimierungHeroMinimal() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 to-blue-800 text-white min-h-[700px]">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Badge className="mb-4">Performance</Badge>
            <h1 className="text-4xl font-bold mb-4">Website Performance Optimierung</h1>
            <p className="text-lg mb-6">Schnellere Websites für bessere Nutzererfahrung und Rankings.</p>
            <Button className="bg-white text-blue-900">
              Mehr erfahren
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 