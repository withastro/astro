import { Logo } from '@/app/components/brand/Logo'
import { LogoVariant1 } from '@/app/components/brand/LogoVariant1'
import { LogoVariant2 } from '@/app/components/brand/LogoVariant2'
import { LogoVariant3 } from '@/app/components/brand/LogoVariant3'
import { LogoVariant4 } from '@/app/components/brand/LogoVariant4'
import { LogoVariant5 } from '@/app/components/brand/LogoVariant5'
import { Card } from '@/components/Card/Card'
import { MarketingLayout } from '@/app/components/layouts/MarketingLayout'

export function LogoShowcase() {
  // Define missing logo components inline
  const LogoHorizontal = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Icon */}
      <g>
        <path 
          d="M20 4L4 12V28L20 36L36 28V12L20 4Z" 
          stroke="#0f172a" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M20 10L10 15V25L20 30L30 25V15L20 10Z" 
          fill="#0f172a" 
          fillOpacity="0.2"
        />
        <path 
          d="M20 16L15 18.5V23.5L20 26L25 23.5V18.5L20 16Z" 
          fill="#0f172a"
        />
      </g>

      {/* Text part - horizontal format */}
      <g fill="#0f172a">
        <path d="M48 12H52V28H48V12Z" />
        <path d="M55 12H59L67 22V12H71V28H67L59 18V28H55V12Z" />
        <path d="M75 12H79V24H87V28H75V12Z" />
        <path d="M89 12H93V24H101V28H89V12Z" />
        <path d="M103 12H117V16H113V28H107V16H103V12Z" />
        <path d="M119 12H123V28H119V12Z" />
        <path d="M126 12H130L138 22V12H142V28H138L130 18V28H126V12Z" />
        <path d="M145 12H157.5C160.5 12 163 14.5 163 17.5V17.5C163 20.5 160.5 23 157.5 23H149V28H145V12ZM149 19H157V16H149V19Z" />
        <path d="M176 23H168L166 28H162L170 12H174L182 28H178L176 23ZM174 19L172 15L170 19H174Z" />
        <path d="M184 12H188V16H195V12H199V28H195V20H188V28H184V12Z" />
        <path d="M212 12H216L224 28H220L218 24H210L208 28H204L212 12ZM216 20L214 16L212 20H216Z" />
        <path d="M226 12H236C237.326 12 238.598 12.5268 239.536 13.4645C240.473 14.4021 241 15.6739 241 17C241 19.76 238.76 22 236 22H230V28H226V12ZM230 18H236C236.53 18 237.039 17.7893 237.414 17.4142C237.789 17.0391 238 16.5304 238 16C238 15.4696 237.789 14.9609 237.414 14.5858C237.039 14.2107 236.53 14 236 14H230V18Z" />
      </g>
    </svg>
  )

  const LogoIcon = () => (
    <svg viewBox="0 0 40 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M20 4L4 12V28L20 36L36 28V12L20 4Z" 
        stroke="#0f172a" 
        strokeWidth="2" 
        fill="none"
      />
      <path 
        d="M20 10L10 15V25L20 30L30 25V15L20 10Z" 
        fill="#0f172a" 
        fillOpacity="0.2"
      />
      <path 
        d="M20 16L15 18.5V23.5L20 26L25 23.5V18.5L20 16Z" 
        fill="#0f172a"
      />
    </svg>
  )

  const CustomVariant1 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Modern gradient design */}
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      <g>
        <path 
          d="M20 4L4 12V28L20 36L36 28V12L20 4Z" 
          stroke="url(#grad1)" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M20 10L10 15V25L20 30L30 25V15L20 10Z" 
          fill="url(#grad1)" 
          fillOpacity="0.2"
        />
        <path 
          d="M20 16L15 18.5V23.5L20 26L25 23.5V18.5L20 16Z" 
          fill="url(#grad1)"
        />
      </g>

      {/* Text part */}
      <g fill="#0f172a">
        <path d="M48 12H52V28H48V12Z" />
        <path d="M55 12H59L67 22V12H71V28H67L59 18V28H55V12Z" />
        <path d="M75 12H79V24H87V28H75V12Z" />
        <path d="M89 12H93V24H101V28H89V12Z" />
        <path d="M103 12H117V16H113V28H107V16H103V12Z" />
        <path d="M119 12H123V28H119V12Z" />
        <path d="M126 12H130L138 22V12H142V28H138L130 18V28H126V12Z" />
        <path d="M145 12H157.5C160.5 12 163 14.5 163 17.5V17.5C163 20.5 160.5 23 157.5 23H149V28H145V12ZM149 19H157V16H149V19Z" />
        <path d="M176 23H168L166 28H162L170 12H174L182 28H178L176 23ZM174 19L172 15L170 19H174Z" />
        <path d="M184 12H188V16H195V12H199V28H195V20H188V28H184V12Z" />
        <path d="M212 12H216L224 28H220L218 24H210L208 28H204L212 12ZM216 20L214 16L212 20H216Z" />
        <path d="M226 12H236C237.326 12 238.598 12.5268 239.536 13.4645C240.473 14.4021 241 15.6739 241 17C241 19.76 238.76 22 236 22H230V28H226V12ZM230 18H236C236.53 18 237.039 17.7893 237.414 17.4142C237.789 17.0391 238 16.5304 238 16C238 15.4696 237.789 14.9609 237.414 14.5858C237.039 14.2107 236.53 14 236 14H230V18Z" />
      </g>
    </svg>
  )

  const CustomVariant2 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bold geometric design */}
      <g>
        <rect x="4" y="8" width="32" height="24" rx="2" fill="#f97316" />
        <rect x="8" y="12" width="24" height="16" rx="1" fill="#fdba74" />
        <rect x="12" y="16" width="16" height="8" rx="1" fill="#fff7ed" />
      </g>
      
      {/* Text part */}
      <g fill="#0f172a">
        <path d="M48 12H52V28H48V12Z" />
        <path d="M55 12H59L67 22V12H71V28H67L59 18V28H55V12Z" />
        <path d="M75 12H79V24H87V28H75V12Z" />
        <path d="M89 12H93V24H101V28H89V12Z" />
        <path d="M103 12H117V16H113V28H107V16H103V12Z" />
        <path d="M119 12H123V28H119V12Z" />
        <path d="M126 12H130L138 22V12H142V28H138L130 18V28H126V12Z" />
        <path d="M145 12H157.5C160.5 12 163 14.5 163 17.5V17.5C163 20.5 160.5 23 157.5 23H149V28H145V12ZM149 19H157V16H149V19Z" />
        <path d="M176 23H168L166 28H162L170 12H174L182 28H178L176 23ZM174 19L172 15L170 19H174Z" />
        <path d="M184 12H188V16H195V12H199V28H195V20H188V28H184V12Z" />
        <path d="M212 12H216L224 28H220L218 24H210L208 28H204L212 12ZM216 20L214 16L212 20H216Z" />
        <path d="M226 12H236C237.326 12 238.598 12.5268 239.536 13.4645C240.473 14.4021 241 15.6739 241 17C241 19.76 238.76 22 236 22H230V28H226V12ZM230 18H236C236.53 18 237.039 17.7893 237.414 17.4142C237.789 17.0391 238 16.5304 238 16C238 15.4696 237.789 14.9609 237.414 14.5858C237.039 14.2107 236.53 14 236 14H230V18Z" />
      </g>
    </svg>
  )

  const CustomVariant3 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Minimalist design */}
      <g>
        <circle cx="20" cy="20" r="16" stroke="#0f172a" strokeWidth="1" fill="none" />
        <line x1="8" y1="20" x2="32" y2="20" stroke="#0f172a" strokeWidth="1" />
        <line x1="20" y1="8" x2="20" y2="32" stroke="#0f172a" strokeWidth="1" />
        <circle cx="20" cy="20" r="4" fill="#3b82f6" />
      </g>
      
      {/* Text part */}
      <g fill="#0f172a">
        <path d="M48 12H52V28H48V12Z" />
        <path d="M55 12H59L67 22V12H71V28H67L59 18V28H55V12Z" />
        <path d="M75 12H79V24H87V28H75V12Z" />
        <path d="M89 12H93V24H101V28H89V12Z" />
        <path d="M103 12H117V16H113V28H107V16H103V12Z" />
        <path d="M119 12H123V28H119V12Z" />
        <path d="M126 12H130L138 22V12H142V28H138L130 18V28H126V12Z" />
        <path d="M145 12H157.5C160.5 12 163 14.5 163 17.5V17.5C163 20.5 160.5 23 157.5 23H149V28H145V12ZM149 19H157V16H149V19Z" />
        <path d="M176 23H168L166 28H162L170 12H174L182 28H178L176 23ZM174 19L172 15L170 19H174Z" />
        <path d="M184 12H188V16H195V12H199V28H195V20H188V28H184V12Z" />
        <path d="M212 12H216L224 28H220L218 24H210L208 28H204L212 12ZM216 20L214 16L212 20H216Z" />
        <path d="M226 12H236C237.326 12 238.598 12.5268 239.536 13.4645C240.473 14.4021 241 15.6739 241 17C241 19.76 238.76 22 236 22H230V28H226V12ZM230 18H236C236.53 18 237.039 17.7893 237.414 17.4142C237.789 17.0391 238 16.5304 238 16C238 15.4696 237.789 14.9609 237.414 14.5858C237.039 14.2107 236.53 14 236 14H230V18Z" />
      </g>
    </svg>
  )

  const CustomVariant4 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tech-inspired design */}
      <g>
        <rect x="4" y="8" width="32" height="24" rx="0" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />
        
        {/* Circuit lines */}
        <path d="M8 12L16 12L16 16L24 16L24 20L32 20" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" />
        <path d="M8 28L16 28L16 24L24 24L24 20" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" />
        
        {/* Circuit nodes */}
        <circle cx="16" cy="12" r="1.5" fill="#3b82f6" />
        <circle cx="16" cy="16" r="1.5" fill="#3b82f6" />
        <circle cx="24" cy="16" r="1.5" fill="#3b82f6" />
        <circle cx="24" cy="20" r="1.5" fill="#3b82f6" />
        <circle cx="32" cy="20" r="1.5" fill="#3b82f6" />
        <circle cx="24" cy="24" r="1.5" fill="#3b82f6" />
        <circle cx="16" cy="24" r="1.5" fill="#3b82f6" />
        <circle cx="16" cy="28" r="1.5" fill="#3b82f6" />
      </g>
      
      {/* Text part */}
      <g fill="#0f172a">
        <path d="M48 12H52V28H48V12Z" />
        <path d="M55 12H59L67 22V12H71V28H67L59 18V28H55V12Z" />
        <path d="M75 12H79V24H87V28H75V12Z" />
        <path d="M89 12H93V24H101V28H89V12Z" />
        <path d="M103 12H117V16H113V28H107V16H103V12Z" />
        <path d="M119 12H123V28H119V12Z" />
        <path d="M126 12H130L138 22V12H142V28H138L130 18V28H126V12Z" />
        <path d="M145 12H157.5C160.5 12 163 14.5 163 17.5V17.5C163 20.5 160.5 23 157.5 23H149V28H145V12ZM149 19H157V16H149V19Z" />
        <path d="M176 23H168L166 28H162L170 12H174L182 28H178L176 23ZM174 19L172 15L170 19H174Z" />
        <path d="M184 12H188V16H195V12H199V28H195V20H188V28H184V12Z" />
        <path d="M212 12H216L224 28H220L218 24H210L208 28H204L212 12ZM216 20L214 16L212 20H216Z" />
        <path d="M226 12H236C237.326 12 238.598 12.5268 239.536 13.4645C240.473 14.4021 241 15.6739 241 17C241 19.76 238.76 22 236 22H230V28H226V12ZM230 18H236C236.53 18 237.039 17.7893 237.414 17.4142C237.789 17.0391 238 16.5304 238 16C238 15.4696 237.789 14.9609 237.414 14.5858C237.039 14.2107 236.53 14 236 14H230V18Z" />
      </g>
    </svg>
  )

  const CustomVariant5 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Elegant flowing curves design */}
      <g>
        <path 
          d="M4 20C4 12 10 4 20 4C30 4 36 12 36 20C36 28 30 36 20 36C10 36 4 28 4 20Z" 
          stroke="#94a3b8" 
          strokeWidth="1" 
          fill="#f8fafc"
        />
        
        {/* Flowing curves */}
        <path 
          d="M4 20C12 16 16 24 20 20C24 16 28 24 36 20" 
          stroke="#3b82f6" 
          strokeWidth="1.5" 
          fill="none"
          strokeLinecap="round"
        />
        
        <path 
          d="M4 16C12 20 16 12 20 16C24 20 28 12 36 16" 
          stroke="#8b5cf6" 
          strokeWidth="1.5" 
          fill="none"
          strokeLinecap="round"
        />
        
        <path 
          d="M4 24C12 20 16 28 20 24C24 20 28 28 36 24" 
          stroke="#ec4899" 
          strokeWidth="1.5" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Text part */}
      <g fill="#0f172a">
        <path d="M48 12H52V28H48V12Z" />
        <path d="M55 12H59L67 22V12H71V28H67L59 18V28H55V12Z" />
        <path d="M75 12H79V24H87V28H75V12Z" />
        <path d="M89 12H93V24H101V28H89V12Z" />
        <path d="M103 12H117V16H113V28H107V16H103V12Z" />
        <path d="M119 12H123V28H119V12Z" />
        <path d="M126 12H130L138 22V12H142V28H138L130 18V28H126V12Z" />
        <path d="M145 12H157.5C160.5 12 163 14.5 163 17.5V17.5C163 20.5 160.5 23 157.5 23H149V28H145V12ZM149 19H157V16H149V19Z" />
        <path d="M176 23H168L166 28H162L170 12H174L182 28H178L176 23ZM174 19L172 15L170 19H174Z" />
        <path d="M184 12H188V16H195V12H199V28H195V20H188V28H184V12Z" />
        <path d="M212 12H216L224 28H220L218 24H210L208 28H204L212 12ZM216 20L214 16L212 20H216Z" />
        <path d="M226 12H236C237.326 12 238.598 12.5268 239.536 13.4645C240.473 14.4021 241 15.6739 241 17C241 19.76 238.76 22 236 22H230V28H226V12ZM230 18H236C236.53 18 237.039 17.7893 237.414 17.4142C237.789 17.0391 238 16.5304 238 16C238 15.4696 237.789 14.9609 237.414 14.5858C237.039 14.2107 236.53 14 236 14H230V18Z" />
      </g>
    </svg>
  )
  
  // Define additional custom logo variants inline
  const CustomVariant6 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Target/Bullseye Icon */}
      <g>
        <circle cx="20" cy="20" r="16" stroke="#64748b" strokeWidth="0.5" fill="#f8fafc" />
        <circle cx="20" cy="20" r="12" stroke="#64748b" strokeWidth="0.5" fill="#f1f5f9" />
        <circle cx="20" cy="20" r="8" stroke="#64748b" strokeWidth="0.5" fill="#e2e8f0" />
        <circle cx="20" cy="20" r="4" stroke="#64748b" strokeWidth="0.5" fill="#cbd5e1" />
        
        {/* Metrics/KPI Arrows */}
        <path d="M32 18L28 14L24 22" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8L20 4L24 6" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 22L12 26L16 24" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Bullseye Center */}
        <circle cx="20" cy="20" r="2" fill="#ef4444" />
      </g>
      
      {/* Text */}
      <g fill="#334155">
        <path d="M48 28V12H52C56.418 12 60 15.582 60 20C60 24.418 56.418 28 52 28H48ZM52 24C54.209 24 56 22.209 56 20C56 17.791 54.209 16 52 16H52V24H52Z" />
        <path d="M62 12H66V28H62V12Z" />
        <path d="M68 12H72V20L80 12H85L76 21L85 28H80L72 21V28H68V12Z" />
        <path d="M87 12H91V24H99V28H87V12Z" />
        <path d="M114 16H106V24H114V16ZM102 12H118V28H102V12Z" />
        <path d="M120 12H124V21C124 22.657 125.343 24 127 24H135C136.657 24 138 22.657 138 21V12H142V21C142 24.866 138.866 28 135 28H127C123.134 28 120 24.866 120 21V12Z" />
        <path d="M144 12H148V24H156V28H144V12Z" />
        <path d="M166 28L163 24H159L166 12H170L177 28H173L170 22L168 18L166 22L163 28H166Z" />
        <path d="M179 12H183V16H190V12H194V28H190V20H183V28H179V12Z" />
        <path d="M196 12H200V28H196V12Z" />
        <path d="M202 12H206V20L214 12H219L210 21L219 28H214L206 21V28H202V12Z" />
        <path d="M233 28L230 24H226L233 12H237L244 28H240L237 22L235 18L233 22L230 28H233Z" />
      </g>
    </svg>
  )
  
  const CustomVariant7 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Digital Marketing Shield Logo */}
      <g>
        <path d="M20 4L4 12V24L20 36L36 24V12L20 4Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
        <path d="M20 8L8 14V22L20 32L32 22V14L20 8Z" fill="#f1f5f9" stroke="#475569" strokeWidth="1" />
        
        {/* Marketing Channels */}
        <circle cx="16" cy="16" r="3" fill="#3b82f6" /> {/* Social */}
        <circle cx="24" cy="16" r="3" fill="#ef4444" /> {/* Search */}
        <circle cx="16" cy="24" r="3" fill="#f97316" /> {/* Email */}
        <circle cx="24" cy="24" r="3" fill="#84cc16" /> {/* Display */}
        
        {/* Connections */}
        <line x1="16" y1="16" x2="24" y2="16" stroke="#64748b" strokeWidth="0.5" />
        <line x1="16" y1="16" x2="16" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="16" y1="16" x2="24" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="24" y1="16" x2="24" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="24" y1="16" x2="16" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="16" y1="24" x2="24" y2="24" stroke="#64748b" strokeWidth="0.5" />
        
        <circle cx="20" cy="20" r="2" fill="#0f172a" />
      </g>
      
      {/* Text */}
      <g fill="#0f172a">
        <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
        <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
        <path d="M97 12H101V28H97V12Z" />
        <path d="M103 12H107L115 22V12H119V28H115L107 18V28H103V12Z" />
        <path d="M121 12H125V28H121V12Z" />
        <path d="M127 12H131V20C131 22.209 132.791 24 135 24H143C145.209 24 147 22.209 147 20V12H151V20C151 24.418 147.418 28 143 28H135C130.582 28 127 24.418 127 20V12Z" />
        <path d="M153 12H157V28H153V12Z" />
        <path d="M159 12H174L178 16L174 20L178 24L174 28H159V12ZM163 16V24H172L170 22L172 20L170 18L172 16H163Z" />
        <path d="M190 16H182V24H190V16ZM178 12H194V28H178V12Z" />
        <path d="M197 12H210C211.105 12 212 12.895 212 14V26C212 27.105 211.105 28 210 28H197V12ZM201 16V24H208V16H201Z" />
        <path d="M214 12H218V28H214V12Z" />
        <path d="M220 12H235C236.105 12 237 12.895 237 14V14C237 15.105 236.105 16 235 16H224V19H235C236.105 19 237 19.895 237 21V26C237 27.105 236.105 28 235 28H220V25H233V22H220V12ZM224 15H233V13H224V15Z" />
      </g>
    </svg>
  )
  
  const CustomVariant8 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Analytics/Dashboard Theme */}
      <g>
        <rect x="4" y="8" width="32" height="24" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
        
        {/* Chart Areas */}
        <rect x="8" y="12" width="10" height="8" rx="1" fill="#bfdbfe" />
        <rect x="22" y="12" width="10" height="8" rx="1" fill="#bfdbfe" />
        <rect x="8" y="22" width="24" height="6" rx="1" fill="#bfdbfe" />
        
        {/* Chart Elements */}
        <path d="M8 16L10 14L12 15L14 13L16 15L18 12" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 16L24 15L26 17L28 14L30 16L32 13" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        
        <rect x="10" y="24" width="2" height="3" fill="#3b82f6" />
        <rect x="14" y="23" width="2" height="4" fill="#3b82f6" />
        <rect x="18" y="25" width="2" height="2" fill="#3b82f6" />
        <rect x="22" y="22" width="2" height="5" fill="#3b82f6" />
        <rect x="26" y="24" width="2" height="3" fill="#3b82f6" />
      </g>
      
      {/* Text */}
      <g fill="#0f172a">
        <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
        <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
        <path d="M97 12H101V28H97V12Z" />
        <path d="M103 12H107L115 22V12H119V28H115L107 18V28H103V12Z" />
        <path d="M121 12H125V28H121V12Z" />
        <path d="M127 12H131V20C131 22.209 132.791 24 135 24H143C145.209 24 147 22.209 147 20V12H151V20C151 24.418 147.418 28 143 28H135C130.582 28 127 24.418 127 20V12Z" />
        <path d="M153 12H157V28H153V12Z" />
        <path d="M160 20C160 15.582 163.582 12 168 12H173C177.971 12 182 16.029 182 21V28H178V21C178 18.239 175.761 16 173 16H168C165.239 16 163 18.239 163 21C163 23.761 165.239 26 168 26H182V30H168C163.582 30 160 26.418 160 22V20Z" />
        <path d="M195 16H187V24H195V16ZM183 12H199V28H183V12Z" />
        <path d="M209 16H201V24H209V16ZM197 12H213V28H197V12Z" />
        <path d="M215 12H219V28H215V12Z" />
        <path d="M233 17C233 14.239 230.761 12 228 12H221V28H225V24H228C230.761 24 233 21.761 233 19V17ZM225 16H228C228.552 16 229 16.448 229 17V19C229 19.552 228.552 20 228 20H225V16Z" />
        <path d="M235 12H239V28H235V12Z" />
      </g>
    </svg>
  )
  
  const CustomVariant9 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rocket/Growth Icon */}
      <g>
        {/* Background Circle */}
        <circle cx="20" cy="20" r="16" fill="#f8fafc" />
        
        {/* Rocket */}
        <path d="M20 8C17 8 14 11 14 17L26 17C26 11 23 8 20 8Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
        <path d="M14 17C12 17 10 19 10 22L18 22L14 17Z" fill="#60a5fa" />
        <path d="M26 17L22 22L30 22C30 19 28 17 26 17Z" fill="#60a5fa" />
        <rect x="18" y="17" width="4" height="12" fill="#3b82f6" />
        
        {/* Flame/Exhaust */}
        <path d="M18 29L17 33L20 31L23 33L22 29" fill="#f97316" />
        
        {/* Growth Line */}
        <path d="M10 26L14 22L18 23L22 20L26 21L30 18" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="2 1" />
        
        {/* Stars */}
        <circle cx="14" cy="12" r="1" fill="#f59e0b" />
        <circle cx="26" cy="12" r="1" fill="#f59e0b" />
        <circle cx="30" cy="26" r="1" fill="#f59e0b" />
        <circle cx="10" cy="26" r="1" fill="#f59e0b" />
      </g>
      
      {/* Text */}
      <g fill="#0f172a">
        <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
        <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
        <path d="M97 12H101V28H97V12Z" />
        <path d="M103 12H107L115 22V12H119V28H115L107 18V28H103V12Z" />
        <path d="M121 12H125V28H121V12Z" />
        <path d="M127 12H131V20C131 22.209 132.791 24 135 24H143C145.209 24 147 22.209 147 20V12H151V20C151 24.418 147.418 28 143 28H135C130.582 28 127 24.418 127 20V12Z" />
        <path d="M153 12H157V28H153V12Z" />
        <path d="M159 12H172C173.657 12 175 13.343 175 15V25C175 26.657 173.657 28 172 28H159V12ZM163 16V24H171V16H163Z" />
        <path d="M186 12H199C200.657 12 202 13.343 202 15V19C202 20.657 200.657 22 199 22H195L202 28H197L190 22V28H186V12ZM190 16V18H198V16H190Z" />
        <path d="M204 12H218C219.657 12 221 13.343 221 15V25C221 26.657 219.657 28 218 28H204V12ZM208 16V24H217V16H208Z" />
        <path d="M223 12H231C234.866 12 238 15.134 238 19V21C238 24.866 234.866 28 231 28H223V12ZM227 16V24H231C232.657 24 234 22.657 234 21V19C234 17.343 232.657 16 231 16H227Z" />
        <path d="M240 12H244V28H240V12Z" />
      </g>
    </svg>
  )
  
  const CustomVariant10 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Digital Funnel/Conversion Icon */}
      <g>
        <path d="M4 8H36V12L28 20V32L12 32V20L4 12V8Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Funnel Segments */}
        <path d="M6 10H34V12L26 20V30L14 30V20L6 12V10Z" fill="#e2e8f0" />
        <path d="M8 10H32L26 16H14L8 10Z" fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.5" />
        <path d="M14 16H26L24 21H16L14 16Z" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" />
        <path d="M16 21H24L22 26H18L16 21Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" />
        <path d="M18 26H22V30H18V26Z" fill="#eff6ff" stroke="#3b82f6" strokeWidth="0.5" />
        
        {/* Conversion Points */}
        <circle cx="20" cy="13" r="1.5" fill="#3b82f6" />
        <circle cx="20" cy="19" r="1" fill="#3b82f6" />
        <circle cx="20" cy="24" r="0.75" fill="#3b82f6" />
        <circle cx="20" cy="28" r="0.5" fill="#3b82f6" />
      </g>
      
      {/* Text */}
      <g fill="#0f172a">
        <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
        <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
        <path d="M97 12H101V28H97V12Z" />
        <path d="M103 12H107L115 22V12H119V28H115L107 18V28H103V12Z" />
        <path d="M121 12H125V28H121V12Z" />
        <path d="M127 12H131V20C131 22.209 132.791 24 135 24H143C145.209 24 147 22.209 147 20V12H151V20C151 24.418 147.418 28 143 28H135C130.582 28 127 24.418 127 20V12Z" />
        <path d="M153 12H157V28H153V12Z" />
        <path d="M159 12H162V28H159V12Z" />
        <path d="M164 12H183V16H175V28H171V16H164V12Z" />
        <path d="M185 20C185 15.582 188.582 12 193 12H201C205.418 12 209 15.582 209 20C209 24.418 205.418 28 201 28H193C188.582 28 185 24.418 185 20ZM193 16C190.791 16 189 17.791 189 20C189 22.209 190.791 24 193 24H201C203.209 24 205 22.209 205 20C205 17.791 203.209 16 201 16H193Z" />
        <path d="M211 12H215V24H223V28H211V12Z" />
        <path d="M225 12H240C241.105 12 242 12.895 242 14V26C242 27.105 241.105 28 240 28H225V12ZM229 16V24H238V16H229Z" />
      </g>
    </svg>
  )

  const CustomVariant11 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Global Connections Theme */}
      <g>
        <circle cx="20" cy="20" r="16" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Globe/Earth Grid */}
        <ellipse cx="20" cy="20" rx="12" ry="8" stroke="#64748b" strokeWidth="0.5" fill="none" />
        <line x1="8" y1="20" x2="32" y2="20" stroke="#64748b" strokeWidth="0.5" />
        <line x1="20" y1="12" x2="20" y2="28" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Connection Points */}
        <circle cx="14" cy="16" r="1.5" fill="#3b82f6" />
        <circle cx="26" cy="16" r="1.5" fill="#ef4444" />
        <circle cx="14" cy="24" r="1.5" fill="#f97316" />
        <circle cx="26" cy="24" r="1.5" fill="#10b981" />
        
        {/* Connection Lines */}
        <path d="M14 16L26 16L26 24L14 24L14 16" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 1" fill="none" />
        <path d="M14 16L26 24" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 1" fill="none" />
        <path d="M26 16L14 24" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 1" fill="none" />
        
        {/* Global Data Paths */}
        <path d="M36 14C33 16 29 18 20 18C11 18 7 16 4 14" stroke="#3b82f6" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M36 26C33 24 29 22 20 22C11 22 7 24 4 26" stroke="#3b82f6" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant12 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Digital Growth/Staircase Theme */}
      <g>
        {/* Staircase/Growth Steps */}
        <rect x="4" y="28" width="6" height="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <rect x="10" y="24" width="6" height="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <rect x="16" y="20" width="6" height="12" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <rect x="22" y="16" width="6" height="16" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <rect x="28" y="12" width="6" height="20" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <rect x="34" y="8" width="6" height="24" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Growth Line */}
        <path d="M7 26L13 22L19 18L25 14L31 10L37 6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Growth Nodes */}
        <circle cx="7" cy="26" r="1.5" fill="#3b82f6" />
        <circle cx="13" cy="22" r="1.5" fill="#3b82f6" />
        <circle cx="19" cy="18" r="1.5" fill="#3b82f6" />
        <circle cx="25" cy="14" r="1.5" fill="#3b82f6" />
        <circle cx="31" cy="10" r="1.5" fill="#3b82f6" />
        <circle cx="37" cy="6" r="1.5" fill="#3b82f6" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant13 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Digital Brain/AI Theme */}
      <g>
        {/* Brain Outline */}
        <path d="M20 4C12 4 4 12 4 20C4 28 12 36 20 36C28 36 36 28 36 20C36 12 28 4 20 4Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Neural Network */}
        <circle cx="20" cy="14" r="2" fill="#3b82f6" />
        <circle cx="14" cy="18" r="2" fill="#3b82f6" />
        <circle cx="26" cy="18" r="2" fill="#3b82f6" />
        <circle cx="11" cy="24" r="2" fill="#3b82f6" />
        <circle cx="20" cy="24" r="2" fill="#3b82f6" />
        <circle cx="29" cy="24" r="2" fill="#3b82f6" />
        <circle cx="16" cy="30" r="2" fill="#3b82f6" />
        <circle cx="24" cy="30" r="2" fill="#3b82f6" />
        
        {/* Connections */}
        <line x1="20" y1="14" x2="14" y2="18" stroke="#64748b" strokeWidth="0.5" />
        <line x1="20" y1="14" x2="26" y2="18" stroke="#64748b" strokeWidth="0.5" />
        <line x1="14" y1="18" x2="11" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="14" y1="18" x2="20" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="26" y1="18" x2="20" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="26" y1="18" x2="29" y2="24" stroke="#64748b" strokeWidth="0.5" />
        <line x1="11" y1="24" x2="16" y2="30" stroke="#64748b" strokeWidth="0.5" />
        <line x1="20" y1="24" x2="16" y2="30" stroke="#64748b" strokeWidth="0.5" />
        <line x1="20" y1="24" x2="24" y2="30" stroke="#64748b" strokeWidth="0.5" />
        <line x1="29" y1="24" x2="24" y2="30" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Data Pulses */}
        <circle cx="17" cy="16" r="0.5" fill="#f97316" />
        <circle cx="23" cy="16" r="0.5" fill="#f97316" />
        <circle cx="12.5" cy="21" r="0.5" fill="#f97316" />
        <circle cx="17" cy="21" r="0.5" fill="#f97316" />
        <circle cx="23" cy="21" r="0.5" fill="#f97316" />
        <circle cx="27.5" cy="21" r="0.5" fill="#f97316" />
        <circle cx="15.5" cy="27" r="0.5" fill="#f97316" />
        <circle cx="20" cy="27" r="0.5" fill="#f97316" />
        <circle cx="24.5" cy="27" r="0.5" fill="#f97316" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant14 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cloud Computing Theme */}
      <g>
        {/* Cloud */}
        <path d="M20 8C15 8 12 11 12 15C9 15 4 17 4 22C4 27 9 32 16 32H24C31 32 36 27 36 22C36 17 31 15 28 15C28 11 25 8 20 8Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Data Icons */}
        <rect x="12" y="18" width="4" height="6" rx="1" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" />
        <rect x="18" y="18" width="4" height="6" rx="1" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" />
        <rect x="24" y="18" width="4" height="6" rx="1" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" />
        
        {/* Connection Lines */}
        <path d="M14 24L14 27L26 27L26 24" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1 1" />
        <path d="M20 24L20 27" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="1 1" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant15 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Social Media Network Theme */}
      <g>
        <circle cx="20" cy="20" r="16" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Network Nodes */}
        <circle cx="20" cy="13" r="3" fill="#3b82f6" />
        <circle cx="12" cy="20" r="3" fill="#ef4444" />
        <circle cx="28" cy="20" r="3" fill="#f97316" />
        <circle cx="16" cy="28" r="3" fill="#10b981" />
        <circle cx="24" cy="28" r="3" fill="#8b5cf6" />
        
        {/* Connection Lines */}
        <line x1="20" y1="13" x2="12" y2="20" stroke="#64748b" strokeWidth="0.5" />
        <line x1="20" y1="13" x2="28" y2="20" stroke="#64748b" strokeWidth="0.5" />
        <line x1="12" y1="20" x2="16" y2="28" stroke="#64748b" strokeWidth="0.5" />
        <line x1="28" y1="20" x2="24" y2="28" stroke="#64748b" strokeWidth="0.5" />
        <line x1="16" y1="28" x2="24" y2="28" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Connection Arrows */}
        <path d="M19 14L13 19" stroke="#3b82f6" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)" />
        <path d="M21 14L27 19" stroke="#3b82f6" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)" />
        <path d="M12 21L15 27" stroke="#ef4444" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)" />
        <path d="M28 21L25 27" stroke="#f97316" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arrow)" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant16 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Search Engine / SEO Theme */}
      <g>
        {/* Magnifying Glass */}
        <circle cx="16" cy="16" r="10" stroke="#64748b" strokeWidth="1.5" fill="#f1f5f9" />
        <path d="M24 24L33 33" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        
        {/* Search Results */}
        <rect x="10" y="14" width="12" height="1" fill="#64748b" />
        <rect x="10" y="17" width="9" height="1" fill="#64748b" />
        <rect x="10" y="20" width="6" height="1" fill="#64748b" />
        
        {/* Ranking/Metrics */}
        <rect x="26" y="10" width="4" height="12" rx="1" fill="#bfdbfe" />
        <rect x="31" y="14" width="4" height="8" rx="1" fill="#bfdbfe" />
        <rect x="36" y="12" width="4" height="10" rx="1" fill="#bfdbfe" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant17 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Content Creation Theme */}
      <g>
        {/* Document/Content */}
        <rect x="8" y="8" width="24" height="24" rx="2" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Text Lines */}
        <rect x="12" y="12" width="16" height="2" rx="1" fill="#3b82f6" />
        <rect x="12" y="16" width="12" height="1" rx="0.5" fill="#64748b" />
        <rect x="12" y="19" width="14" height="1" rx="0.5" fill="#64748b" />
        <rect x="12" y="22" width="10" height="1" rx="0.5" fill="#64748b" />
        
        {/* Image Placeholder */}
        <rect x="12" y="25" width="16" height="4" rx="1" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" />
        
        {/* Pencil/Content Creation */}
        <path d="M29 10L31 12L20 23L18 21L29 10Z" fill="#f97316" stroke="#c2410c" strokeWidth="0.5" />
        <path d="M18 21L17 24L20 23L18 21Z" fill="#f97316" stroke="#c2410c" strokeWidth="0.5" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant18 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Analytics/Data-driven Theme */}
      <g>
        {/* Line Chart */}
        <polyline points="8,28 12,22 16,25 20,18 24,15 28,20 32,12" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        
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
      
      {/* Text - OnlineMarketingCore (unified) */}
      <g fill="#0f172a">
        {/* OnlineMarketingCore text */}
        <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
        <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
        <path d="M97 12H101V28H97V12Z" />
        <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
        <path d="M129 12H133V28H129V12Z" />
        <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
        <path d="M161 12H165V28H161V12Z" />
        <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
        <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
        <path d="M196 12H210C211.657 12 213 13.343 213 15V25C213 26.657 211.657 28 210 28H196V12ZM200 16V24H209V16H200Z" />
        <path d="M215 20C215 15.582 218.582 12 223 12H231C235.418 12 239 15.582 239 20C239 24.418 235.418 28 231 28H223C218.582 28 215 24.418 215 20ZM223 16C220.791 16 219 17.791 219 20C219 22.209 220.791 24 223 24H231C233.209 24 235 22.209 235 20C235 17.791 233.209 16 231 16H223Z" />
        <path d="M245 20C245 15.582 248.582 12 253 12H261C265.418 12 269 15.582 269 20C269 24.418 265.418 28 261 28H253C248.582 28 245 24.418 245 20ZM253 16C250.791 16 249 17.791 249 20C249 22.209 250.791 24 253 24H261C263.209 24 265 22.209 265 20C265 17.791 263.209 16 261 16H253Z" />
        <path d="M271 12H275V24H283V28H271V12Z" />
        <path d="M285 12H289V28H285V12Z" />
      </g>
    </svg>
  )

  const CustomVariant19 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Email Marketing Theme */}
      <g>
        {/* Envelope Base */}
        <rect x="4" y="12" width="32" height="20" rx="2" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        
        {/* Envelope Flap (Open) */}
        <path d="M4 14L20 22L36 14" stroke="#64748b" strokeWidth="0.5" fill="none" />
        
        {/* Email Content */}
        <rect x="10" y="18" width="20" height="10" rx="1" fill="white" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="12" y1="20" x2="28" y2="20" stroke="#3b82f6" strokeWidth="0.5" />
        <line x1="12" y1="22" x2="25" y2="22" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="12" y1="24" x2="22" y2="24" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="12" y1="26" x2="24" y2="26" stroke="#94a3b8" strokeWidth="0.5" />
        
        {/* Send Button/Icon */}
        <circle cx="32" cy="28" r="3" fill="#3b82f6" />
        <path d="M30 28L32 26L34 28L32 30L30 28Z" fill="white" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  const CustomVariant20 = () => (
    <svg viewBox="0 0 240 40" className="h-12 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* E-commerce / Shopping Theme */}
      <g>
        {/* Shopping Cart */}
        <circle cx="18" cy="28" r="2" fill="#64748b" />
        <circle cx="28" cy="28" r="2" fill="#64748b" />
        <path d="M8 10H12L16 24H30L34 14H14" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Product Items */}
        <rect x="16" y="14" width="4" height="4" rx="1" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" />
        <rect x="22" y="14" width="4" height="4" rx="1" fill="#fecaca" stroke="#ef4444" strokeWidth="0.5" />
        <rect x="28" y="14" width="4" height="4" rx="1" fill="#d1fae5" stroke="#10b981" strokeWidth="0.5" />
        
        {/* Price Tag */}
        <path d="M32 8L36 12L26 22L22 18L32 8Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
        <circle cx="34" cy="10" r="1" fill="#64748b" />
      </g>
      
      {/* Text - OnlineMarketing with CORE as subheading aligned right */}
      <g>
        <g fill="#0f172a">
          {/* OnlineMarketing text */}
          <path d="M45 20C45 15.582 48.582 12 53 12H61C65.418 12 69 15.582 69 20C69 24.418 65.418 28 61 28H53C48.582 28 45 24.418 45 20ZM53 16C50.791 16 49 17.791 49 20C49 22.209 50.791 24 53 24H61C63.209 24 65 22.209 65 20C65 17.791 63.209 16 61 16H53Z" />
          <path d="M71 12H75V20C75 22.209 76.791 24 79 24H87C89.209 24 91 22.209 91 20V12H95V20C95 24.418 91.418 28 87 28H79C74.582 28 71 24.418 71 20V12Z" />
          <path d="M97 12H101V28H97V12Z" />
          <path d="M103 12H107V20C107 22.209 108.791 24 111 24H119C121.209 24 123 22.209 123 20V12H127V20C127 24.418 123.418 28 119 28H111C106.582 28 103 24.418 103 20V12Z" />
          <path d="M129 12H133V28H129V12Z" />
          <path d="M135 12H139V20C139 22.209 140.791 24 143 24H151C153.209 24 155 22.209 155 20V12H159V20C159 24.418 155.418 28 151 28H143C138.582 28 135 24.418 135 20V12Z" />
          <path d="M161 12H165V28H161V12Z" />
          <path d="M167 18L175 12H180L170 20L180 28H175L167 22V28H163V12H167V18Z" />
          <path d="M184 22H193C193.552 22 194 21.552 194 21V19C194 18.448 193.552 18 193 18H184V22ZM180 12H193C195.761 12 198 14.239 198 17V19C198 21.761 195.761 24 193 24H184V28H180V12Z" />
          <path d="M196 12H213C214.105 12 215 12.895 215 14V26C215 27.105 214.105 28 213 28H196V12ZM200 16V24H211V16H200Z" />
          <path d="M217 12H221V28H217V12Z" />
          <path d="M223 12H227V20C227 22.209 228.791 24 231 24H239C241.209 24 243 22.209 243 20V12H247V20C247 24.418 243.418 28 239 28H231C226.582 28 223 24.418 223 20V12Z" />
        </g>
        
        {/* CORE subheading aligned right */}
        <g fill="#475569" transform="translate(198, 34)">
          <path d="M0 0H8C10.2091 0 12 1.79086 12 4V4C12 6.20914 10.2091 8 8 8H0V0ZM4 4H8C8.55229 4 9 3.55229 9 3V3C9 2.44772 8.55229 2 8 2H4V4Z" />
          <path d="M14 0H22C24.2091 0 26 1.79086 26 4V4C26 6.20914 24.2091 8 22 8H14V0ZM18 4H22C22.5523 4 23 3.55229 23 3V3C23 2.44772 22.5523 2 22 2H18V4Z" />
          <path d="M28 0H36C38.2091 0 40 1.79086 40 4V4C40 6.20914 38.2091 8 36 8H28V0ZM32 4H36C36.5523 4 37 3.55229 37 3V3C37 2.44772 36.5523 2 36 2H32V4Z" />
          <path d="M42 0H50C52.2091 0 54 1.79086 54 4V4C54 6.20914 52.2091 8 50 8H42V0ZM46 4H50C50.5523 4 51 3.55229 51 3V3C51 2.44772 50.5523 2 50 2H46V4Z" />
        </g>
      </g>
    </svg>
  )

  return (
    <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Logo Showcase</h2>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Choose from our selection of logo variants for your brand identity.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {/* Original Logos */}
        <div className="flex flex-col items-center">
          <Logo variant="primary" size="lg" />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Standard Square</h3>
          <p className="text-base leading-7 text-gray-600">Clean and versatile square format logo.</p>
        </div>
        <div className="flex flex-col items-center">
          <LogoHorizontal />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Horizontal</h3>
          <p className="text-base leading-7 text-gray-600">Wide format perfect for headers and footers.</p>
        </div>
        <div className="flex flex-col items-center">
          <LogoIcon />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Icon Only</h3>
          <p className="text-base leading-7 text-gray-600">Simplified icon for small spaces and favicons.</p>
        </div>

        {/* Custom Variants */}
        <div className="flex flex-col items-center">
          <CustomVariant1 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 1</h3>
          <p className="text-base leading-7 text-gray-600">Modern design with gradient elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant2 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 2</h3>
          <p className="text-base leading-7 text-gray-600">Bold geometric shapes with vibrant colors.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant3 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 3</h3>
          <p className="text-base leading-7 text-gray-600">Minimalist design with subtle color accents.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant4 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 4</h3>
          <p className="text-base leading-7 text-gray-600">Tech-inspired design with circuit elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant5 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 5</h3>
          <p className="text-base leading-7 text-gray-600">Elegant design with flowing curves.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant6 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 6</h3>
          <p className="text-base leading-7 text-gray-600">Playful design with abstract elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant7 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 7</h3>
          <p className="text-base leading-7 text-gray-600">Corporate design with professional aesthetics.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant8 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 8</h3>
          <p className="text-base leading-7 text-gray-600">Retro-inspired with classic typography.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant9 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 9</h3>
          <p className="text-base leading-7 text-gray-600">Futuristic design with dynamic elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant10 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 10</h3>
          <p className="text-base leading-7 text-gray-600">Organic design with natural influences.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant11 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 11</h3>
          <p className="text-base leading-7 text-gray-600">Digital marketing themed with conversion elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant12 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 12</h3>
          <p className="text-base leading-7 text-gray-600">AI-focused design with neural network elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant13 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 13</h3>
          <p className="text-base leading-7 text-gray-600">Web development theme with code elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant14 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 14</h3>
          <p className="text-base leading-7 text-gray-600">Cloud computing theme with data storage elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant15 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 15</h3>
          <p className="text-base leading-7 text-gray-600">Social media network theme with connection nodes.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant16 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 16</h3>
          <p className="text-base leading-7 text-gray-600">Search engine optimization theme with metrics.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant17 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 17</h3>
          <p className="text-base leading-7 text-gray-600">Content creation theme with document elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant18 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 18</h3>
          <p className="text-base leading-7 text-gray-600">Analytics theme with data-driven charts.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant19 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 19</h3>
          <p className="text-base leading-7 text-gray-600">Email marketing theme with newsletter elements.</p>
        </div>
        <div className="flex flex-col items-center">
          <CustomVariant20 />
          <h3 className="mt-6 text-xl font-semibold leading-8 tracking-tight text-gray-900">Custom Variant 20</h3>
          <p className="text-base leading-7 text-gray-600">E-commerce theme with shopping elements.</p>
        </div>
      </div>
    </div>
  )
} 