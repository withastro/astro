'use client';

import { useParams } from 'next/navigation';
import { Locale } from '@/app/i18n/config';

export default function LogoShowcasePage() {
  const params = useParams();
  const locale = params.locale as Locale;

  // Main OnlineMarketingCore Logo Component
  const OnlineMarketingCoreLogo = () => (
    <div className="flex items-center justify-center space-x-6">
      {/* Analytics Icon */}
      <div className="flex-shrink-0">
        <svg viewBox="0 0 40 40" className="h-20 w-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            {/* Line Chart */}
            <polyline 
              points="8,28 12,22 16,25 20,18 24,15 28,20 32,12" 
              stroke="#3b82f6" 
              strokeWidth="1.5" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Bar Chart */}
            <rect x="8" y="32" width="3" height="4" fill="#f97316" />
            <rect x="13" y="30" width="3" height="6" fill="#f97316" />
            <rect x="18" y="28" width="3" height="8" fill="#f97316" />
            <rect x="23" y="26" width="3" height="10" fill="#f97316" />
            <rect x="28" y="24" width="3" height="12" fill="#f97316" />
            
            {/* Grid Background */}
            <line x1="8" y1="12" x2="8" y2="36" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="16" y1="12" x2="16" y2="36" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="24" y1="12" x2="24" y2="36" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="32" y1="12" x2="32" y2="36" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="4" y1="16" x2="36" y2="16" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="4" y1="24" x2="36" y2="24" stroke="#e2e8f0" strokeWidth="0.5" />
            <line x1="4" y1="32" x2="36" y2="32" stroke="#e2e8f0" strokeWidth="0.5" />
          </g>
        </svg>
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start">
        <span className="text-4xl font-bold tracking-tight text-gray-900 leading-none">
          OnlineMarketing
        </span>
        <span className="text-2xl font-semibold tracking-widest text-blue-600 uppercase mt-1">
          CORE
        </span>
      </div>
    </div>
  );

  // Dark Mode Variant
  const DarkModeVariant = () => (
    <div className="flex items-center justify-center space-x-6 bg-gray-900 p-8 rounded-xl">
      {/* Analytics Icon */}
      <div className="flex-shrink-0">
        <svg viewBox="0 0 40 40" className="h-20 w-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <polyline 
              points="8,28 12,22 16,25 20,18 24,15 28,20 32,12" 
              stroke="#60a5fa" 
              strokeWidth="1.5" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            <rect x="8" y="32" width="3" height="4" fill="#fb923c" />
            <rect x="13" y="30" width="3" height="6" fill="#fb923c" />
            <rect x="18" y="28" width="3" height="8" fill="#fb923c" />
            <rect x="23" y="26" width="3" height="10" fill="#fb923c" />
            <rect x="28" y="24" width="3" height="12" fill="#fb923c" />
            <line x1="8" y1="12" x2="8" y2="36" stroke="#475569" strokeWidth="0.5" />
            <line x1="16" y1="12" x2="16" y2="36" stroke="#475569" strokeWidth="0.5" />
            <line x1="24" y1="12" x2="24" y2="36" stroke="#475569" strokeWidth="0.5" />
            <line x1="32" y1="12" x2="32" y2="36" stroke="#475569" strokeWidth="0.5" />
            <line x1="4" y1="16" x2="36" y2="16" stroke="#475569" strokeWidth="0.5" />
            <line x1="4" y1="24" x2="36" y2="24" stroke="#475569" strokeWidth="0.5" />
            <line x1="4" y1="32" x2="36" y2="32" stroke="#475569" strokeWidth="0.5" />
          </g>
        </svg>
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start">
        <span className="text-4xl font-bold tracking-tight text-white leading-none">
          OnlineMarketing
        </span>
        <span className="text-2xl font-semibold tracking-widest text-blue-400 uppercase mt-1">
          CORE
        </span>
      </div>
    </div>
  );

  // Gradient Variant
  const GradientVariant = () => (
    <div className="flex items-center justify-center space-x-6 bg-gradient-to-r from-indigo-100 to-blue-100 p-8 rounded-xl">
      {/* Analytics Icon */}
      <div className="flex-shrink-0">
        <svg viewBox="0 0 40 40" className="h-20 w-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <polyline 
              points="8,28 12,22 16,25 20,18 24,15 28,20 32,12" 
              stroke="#1e40af" 
              strokeWidth="1.5" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            <rect x="8" y="32" width="3" height="4" fill="#ea580c" />
            <rect x="13" y="30" width="3" height="6" fill="#ea580c" />
            <rect x="18" y="28" width="3" height="8" fill="#ea580c" />
            <rect x="23" y="26" width="3" height="10" fill="#ea580c" />
            <rect x="28" y="24" width="3" height="12" fill="#ea580c" />
            <line x1="8" y1="12" x2="8" y2="36" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="16" y1="12" x2="16" y2="36" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="24" y1="12" x2="24" y2="36" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="32" y1="12" x2="32" y2="36" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="4" y1="16" x2="36" y2="16" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="4" y1="24" x2="36" y2="24" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="4" y1="32" x2="36" y2="32" stroke="#cbd5e1" strokeWidth="0.5" />
          </g>
        </svg>
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start">
        <span className="text-4xl font-bold tracking-tight text-indigo-900 leading-none">
          OnlineMarketing
        </span>
        <span className="text-2xl font-semibold tracking-widest text-orange-600 uppercase mt-1">
          CORE
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Main Logo Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            OnlineMarketingCore Brand
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A modern, data-driven approach to digital marketing, represented through clean design and analytics-inspired visuals.
          </p>
        </div>

        {/* Main Logo Display */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="p-8 sm:p-12">
            <OnlineMarketingCoreLogo />
          </div>
        </div>

        {/* Logo Variants */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Logo Variations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dark Mode Variant */}
          <div className="rounded-2xl shadow-xl overflow-hidden">
            <DarkModeVariant />
            <div className="bg-white p-4 text-center">
              <h3 className="font-medium text-gray-900">Dark Mode</h3>
              <p className="text-sm text-gray-500">Optimized for dark interfaces</p>
            </div>
          </div>

          {/* Gradient Variant */}
          <div className="rounded-2xl shadow-xl overflow-hidden">
            <GradientVariant />
            <div className="bg-white p-4 text-center">
              <h3 className="font-medium text-gray-900">Gradient Style</h3>
              <p className="text-sm text-gray-500">Enhanced visual hierarchy</p>
            </div>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Usage Guidelines</h2>
          <div className="max-w-3xl mx-auto text-left grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Primary Logo</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Use on light backgrounds</li>
                <li>• Maintain spacing around logo</li>
                <li>• Don't alter the proportions</li>
                <li>• Keep icon and text together</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Color Variants</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Dark mode for dark interfaces</li>
                <li>• Gradient for promotional materials</li>
                <li>• Maintain color relationships</li>
                <li>• Use provided color codes only</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 