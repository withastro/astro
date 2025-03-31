import React from 'react';

interface LogoProps {
  variant?: 'horizontal' | 'icon';
  className?: string;
  mode?: 'light' | 'dark';
}

export function Logo({ variant = 'horizontal', className = '', mode = 'light' }: LogoProps) {
  const textColor = mode === 'dark' ? 'text-white' : 'text-gray-900';
  const accentColor = mode === 'dark' ? 'text-blue-400' : 'text-blue-600';
  const strokeColor = mode === 'dark' ? '#60a5fa' : '#3b82f6';
  const fillColor = mode === 'dark' ? '#fb923c' : '#f97316';

  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 40 40" className={`h-8 w-8 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <polyline 
            points="8,28 12,22 16,25 20,18 24,15 28,20 32,12" 
            stroke={strokeColor}
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <rect x="8" y="32" width="3" height="4" fill={fillColor} />
          <rect x="13" y="30" width="3" height="6" fill={fillColor} />
          <rect x="18" y="28" width="3" height="8" fill={fillColor} />
          <rect x="23" y="26" width="3" height="10" fill={fillColor} />
          <rect x="28" y="24" width="3" height="12" fill={fillColor} />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <polyline 
            points="8,28 12,22 16,25 20,18 24,15 28,20 32,12" 
            stroke={strokeColor}
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <rect x="8" y="32" width="3" height="4" fill={fillColor} />
          <rect x="13" y="30" width="3" height="6" fill={fillColor} />
          <rect x="18" y="28" width="3" height="8" fill={fillColor} />
          <rect x="23" y="26" width="3" height="10" fill={fillColor} />
          <rect x="28" y="24" width="3" height="12" fill={fillColor} />
        </g>
      </svg>
      <div className="flex flex-col">
        <span className={`text-lg font-bold leading-none ${textColor}`}>OnlineMarketing</span>
        <span className={`text-sm font-semibold tracking-wider ${accentColor}`}>CORE</span>
      </div>
    </div>
  );
} 