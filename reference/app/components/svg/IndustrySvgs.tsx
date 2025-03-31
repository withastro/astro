'use client';

import React from 'react';

export const B2BIndustrySvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="b2bGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#b2bGradient)" />
    
    {/* Buildings Silhouette */}
    <path d="M0,600 L0,300 L100,300 L100,350 L150,350 L150,250 L200,250 L200,400 L250,400 L250,200 L350,200 L350,400 L400,400 L400,150 L500,150 L500,450 L550,450 L550,300 L650,300 L650,500 L700,500 L700,400 L800,400 L800,600 Z" fill="#0f2350" />
    
    {/* Connection Lines */}
    <path d="M150,250 C250,150 350,350 450,250 C550,150 650,350 750,250" stroke="#ffffff" strokeWidth="3" strokeDasharray="15,10" fill="none" />
    
    {/* Connection Dots */}
    {[200, 300, 400, 500, 600].map((x, i) => (
      <circle key={i} cx={x} cy={250 + (i % 2) * 100} r="10" fill="#ffffff" />
    ))}
    
    {/* Abstract Network */}
    <g opacity="0.6">
      <line x1="200" y1="300" x2="400" y2="250" stroke="#ffffff" strokeWidth="2" />
      <line x1="400" y1="250" x2="600" y2="350" stroke="#ffffff" strokeWidth="2" />
      <line x1="300" y1="200" x2="400" y2="250" stroke="#ffffff" strokeWidth="2" />
      <line x1="400" y1="250" x2="500" y2="200" stroke="#ffffff" strokeWidth="2" />
    </g>
  </svg>
);

export const EcommerceSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="ecommerceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#065f46" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#ecommerceGradient)" />
    
    {/* Shopping Cart */}
    <g transform="translate(300, 250) scale(1.5)">
      <circle cx="50" cy="120" r="15" fill="#ffffff" />
      <circle cx="150" cy="120" r="15" fill="#ffffff" />
      <path d="M0,0 L30,0 L60,90 L180,90 L160,30 L80,30 M60,90 L60,120" stroke="#ffffff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    
    {/* Products Grid */}
    <g opacity="0.6">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 100 + (i % 3) * 200;
        const y = 400 + Math.floor(i / 3) * 100;
        return (
          <rect key={i} x={x} y={y} width="150" height="80" rx="10" fill="#ffffff" opacity="0.2" />
        );
      })}
    </g>

    {/* Price Tags */}
    {[120, 320, 520].map((x, i) => (
      <text key={i} x={x} y="500" fontFamily="Arial" fontSize="20" fill="#ffffff">€{(19.99 + i * 10).toFixed(2)}</text>
    ))}
  </svg>
);

export const LocalServiceSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="localServiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c2d12" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#localServiceGradient)" />
    
    {/* Map Pin */}
    <g transform="translate(400, 280)">
      <path d="M0,-150 C-100,-150 -150,-80 -150,0 C-150,100 0,200 0,200 C0,200 150,100 150,0 C150,-80 100,-150 0,-150 Z" fill="#ffffff" opacity="0.9" />
      <circle cx="0" cy="-20" r="40" fill="#ea580c" />
    </g>
    
    {/* City Buildings */}
    <path d="M100,600 L100,450 L200,450 L200,500 L300,500 L300,400 L400,400 L400,500 L500,500 L500,450 L600,450 L600,500 L700,500 L700,450 L800,450 L800,600 Z" fill="#ffffff" opacity="0.2" />
    
    {/* Roads */}
    <path d="M0,350 L800,350 M400,200 L400,600" stroke="#ffffff" strokeWidth="10" opacity="0.3" />
    
    {/* Business Icons */}
    {[200, 400, 600].map((x, i) => (
      <circle key={i} cx={x} cy="280" r="25" fill="#ffffff" opacity="0.6" />
    ))}
  </svg>
);

export const EnterpriseSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="enterpriseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#enterpriseGradient)" />
    
    {/* Corporate Building */}
    <g transform="translate(400, 300)">
      <rect x="-150" y="-200" width="300" height="350" fill="#ffffff" opacity="0.8" />
      
      {/* Windows */}
      {[-100, -50, 0, 50, 100].map((x, i) => 
        [-150, -100, -50, 0, 50, 100, 150].map((y, j) => (
          <rect key={`${i}-${j}`} x={x - 15} y={y - 15} width="30" height="30" fill="#3b82f6" opacity={(i + j) % 2 === 0 ? 0.8 : 0.4} />
        ))
      )}
      
      {/* Base */}
      <rect x="-200" y="150" width="400" height="50" fill="#ffffff" opacity="0.6" />
    </g>
    
    {/* Chart Elements */}
    <g transform="translate(650, 200)">
      <rect x="-50" y="-80" width="100" height="160" rx="10" fill="#ffffff" opacity="0.9" />
      <rect x="-30" y="30" width="20" height="30" fill="#3b82f6" />
      <rect x="-5" y="0" width="20" height="60" fill="#3b82f6" />
      <rect x="20" y="-40" width="20" height="100" fill="#3b82f6" />
    </g>
  </svg>
);

export const ITSaaSSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="itSaasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#itSaasGradient)" />
    
    {/* Code & UI Elements */}
    <g transform="translate(400, 300)">
      {/* Browser Window */}
      <rect x="-200" y="-150" width="400" height="300" rx="10" fill="#ffffff" opacity="0.9" />
      <rect x="-200" y="-150" width="400" height="40" rx="10" fill="#e5e7eb" />
      <circle cx="-170" cy="-130" r="8" fill="#ef4444" />
      <circle cx="-145" cy="-130" r="8" fill="#f59e0b" />
      <circle cx="-120" cy="-130" r="8" fill="#10b981" />
      
      {/* Code UI */}
      <rect x="-180" y="-90" width="160" height="220" fill="#1f2937" rx="5" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x="-170" y={-80 + i * 25} width={100 + (i % 3) * 20} height="15" rx="2" fill="#818cf8" opacity="0.6" />
      ))}
      
      {/* App UI */}
      <rect x="0" y="-90" width="160" height="220" fill="#f9fafb" rx="5" />
      <rect x="10" y="-80" width="140" height="40" rx="5" fill="#818cf8" opacity="0.2" />
      <rect x="10" y="-30" width="140" height="20" rx="5" fill="#818cf8" opacity="0.3" />
      <rect x="10" y="0" width="140" height="20" rx="5" fill="#818cf8" opacity="0.3" />
      <rect x="10" y="30" width="140" height="20" rx="5" fill="#818cf8" opacity="0.3" />
      <rect x="10" y="60" width="140" height="40" rx="5" fill="#818cf8" opacity="0.2" />
    </g>
    
    {/* Cloud Elements */}
    <path d="M100,150 C80,120 100,80 140,80 C160,40 220,40 240,80 C280,60 320,80 320,120 C360,100 400,120 400,160 C400,200 360,220 320,200 C300,240 240,240 220,200 C180,220 140,200 140,160 C110,180 80,170 100,150 Z" fill="#ffffff" opacity="0.5" />
  </svg>
);

export const HealthcareSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="healthcareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#be123c" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#healthcareGradient)" />
    
    {/* Medical Cross */}
    <g transform="translate(400, 300)">
      <circle cx="0" cy="0" r="150" fill="#ffffff" opacity="0.8" />
      <rect x="-25" y="-100" width="50" height="200" rx="10" fill="#be123c" />
      <rect x="-100" y="-25" width="200" height="50" rx="10" fill="#be123c" />
    </g>
    
    {/* Pulse Line */}
    <path d="M100,450 L200,450 L250,300 L300,500 L350,400 L400,450 L450,200 L500,450 L550,400 L600,450 L700,450" stroke="#ffffff" strokeWidth="10" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    
    {/* Medical Icons */}
    <g opacity="0.6">
      <circle cx="200" cy="150" r="30" fill="#ffffff" />
      <circle cx="600" cy="150" r="30" fill="#ffffff" />
      <circle cx="150" cy="500" r="30" fill="#ffffff" />
      <circle cx="650" cy="500" r="30" fill="#ffffff" />
      
      {/* Connectivity Lines */}
      <path d="M200,150 L400,300 L600,150" stroke="#ffffff" strokeWidth="3" strokeDasharray="10,5" fill="none" />
      <path d="M150,500 L400,300 L650,500" stroke="#ffffff" strokeWidth="3" strokeDasharray="10,5" fill="none" />
    </g>
  </svg>
); 