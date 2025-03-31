import { MarketingLayout } from "@/app/components/layouts/MarketingLayout";
import { Card } from "@/components/Card/Card";
import { Logo } from '@/app/components/brand/Logo'
import { LogoVariant1 } from '@/app/components/brand/LogoVariant1'
import { LogoVariant2 } from '@/app/components/brand/LogoVariant2'
import { LogoVariant3 } from '@/app/components/brand/LogoVariant3'
import { LogoVariant4 } from '@/app/components/brand/LogoVariant4'
import { LogoVariant5 } from '@/app/components/brand/LogoVariant5'

export default function LogoShowcase() {
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

  return (
    <MarketingLayout
      logo={<Logo variant="primary" size="lg" />}
      navigation={[
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" }
      ]}
    >
      <div className="container py-12">
        <h1 className="mb-8 text-3xl font-bold">OnlineMarketingCORE Logo Options</h1>
        <p className="mb-12 text-lg text-muted-foreground">
          Below are 10 logo variants for OnlineMarketingCORE, each with a unique style and theme 
          related to digital marketing, analytics, and growth.
        </p>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 1: Abstract Hexagon</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <LogoVariant1 size="xl" />
            </div>
            <p className="text-muted-foreground">
              A modern abstract hexagon design representing data complexity with a clean, 
              professional aesthetic that communicates precision and expertise.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 2: Analytics Wheel</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <LogoVariant2 size="xl" />
            </div>
            <p className="text-muted-foreground">
              A circular chart visualization that represents analytics, data segmentation, 
              and the comprehensive view that OnlineMarketingCORE provides.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 3: Growth Charts</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <LogoVariant3 size="xl" />
            </div>
            <p className="text-muted-foreground">
              A clean line chart design that represents success, growth, and data-driven 
              decisions in digital marketing campaigns.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 4: Global Network</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <LogoVariant4 size="xl" />
            </div>
            <p className="text-muted-foreground">
              A connected globe icon that represents global reach, interconnectivity,
              and the worldwide digital marketing presence.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 5: Search Optimization</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <LogoVariant5 size="xl" />
            </div>
            <p className="text-muted-foreground">
              A magnifying glass with embedded analytics, representing search optimization,
              keyword research, and the discovery of valuable marketing insights.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 6: Target Precision</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <CustomVariant6 />
            </div>
            <p className="text-muted-foreground">
              A target/bullseye design with performance indicators, representing 
              precision targeting, audience segmentation, and campaign optimization.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 7: Marketing Shield</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <CustomVariant7 />
            </div>
            <p className="text-muted-foreground">
              A shield-like layout with connected marketing channels, representing
              protection, comprehensive strategy, and multi-channel marketing.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 8: Data Dashboard</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <CustomVariant8 />
            </div>
            <p className="text-muted-foreground">
              A dashboard-style icon with analytics visualizations, representing
              real-time monitoring, performance tracking, and actionable insights.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 9: Growth Rocket</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <CustomVariant9 />
            </div>
            <p className="text-muted-foreground">
              A rocket with growth chart, representing rapid growth, upward
              trajectories, and accelerated marketing results.
            </p>
          </Card>
          
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Logo 10: Conversion Funnel</h2>
            <div className="flex justify-center bg-gray-50 p-6 rounded-lg mb-4">
              <CustomVariant10 />
            </div>
            <p className="text-muted-foreground">
              A marketing funnel with conversion points, representing the customer
              journey, conversion optimization, and the sales pipeline.
            </p>
          </Card>
        </div>
      </div>
    </MarketingLayout>
  )
} 