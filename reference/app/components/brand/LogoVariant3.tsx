import { cn } from "@/lib/utils"

interface LogoVariant3Props {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function LogoVariant3({
  size = "md",
  className,
  showText = true
}: LogoVariant3Props) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16"
  }

  return (
    <div className={cn(sizeClasses[size], "flex items-center", className)}>
      <svg 
        viewBox="0 0 240 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Line Chart Icon */}
        <g>
          {/* Background square */}
          <rect x="4" y="4" width="32" height="32" rx="2" fill="#f1f5f9" />
          
          {/* Grid lines */}
          <line x1="10" y1="28" x2="30" y2="28" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1 1" />
          <line x1="10" y1="22" x2="30" y2="22" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1 1" />
          <line x1="10" y1="16" x2="30" y2="16" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1 1" />
          <line x1="10" y1="10" x2="30" y2="10" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1 1" />
          
          {/* Axes */}
          <line x1="10" y1="8" x2="10" y2="30" stroke="#64748b" strokeWidth="1" />
          <line x1="8" y1="28" x2="32" y2="28" stroke="#64748b" strokeWidth="1" />
          
          {/* Chart lines */}
          <path 
            d="M10 20L14 24L18 14L22 18L26 10L30 16" 
            stroke="#3b82f6" 
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          <circle cx="14" cy="24" r="1.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
          <circle cx="18" cy="14" r="1.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
          <circle cx="22" cy="18" r="1.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
          <circle cx="26" cy="10" r="1.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
          <circle cx="30" cy="16" r="1.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
          
          {/* Highlight line */}
          <path 
            d="M10 24L14 18L18 26L22 22L26 18L30 22" 
            stroke="#f97316" 
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="2 1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Text */}
        {showText && (
          <g fill="#0f172a">
            <path d="M45 20C45 16.134 48.134 13 52 13H62C65.866 13 69 16.134 69 20C69 23.866 65.866 27 62 27H52C48.134 27 45 23.866 45 20ZM52 16C49.791 16 48 17.791 48 20C48 22.209 49.791 24 52 24H62C64.209 24 66 22.209 66 20C66 17.791 64.209 16 62 16H52Z" />
            <path d="M71 13H74V21C74 23.761 76.239 26 79 26H87C89.761 26 92 23.761 92 21V13H95V21C95 25.418 91.418 29 87 29H79C74.582 29 71 25.418 71 21V13Z" />
            <path d="M97 13H100V27H97V13Z" />
            <path d="M102 13H105L114 23V13H117V27H114L105 17V27H102V13Z" />
            <path d="M119 13H131C132.105 13 133 13.895 133 15V15C133 16.105 132.105 17 131 17H122V19H131C132.105 19 133 19.895 133 21V25C133 26.105 132.105 27 131 27H119V24H130V22H119V13ZM122 16H130V14H122V16Z" />
            <path d="M146 16L138 16V24H146V16ZM148 27H136V13H148V27Z" />
            <path d="M150 13H153V19C153 20.657 154.343 22 156 22H164C165.657 22 167 20.657 167 19V13H170V19C170 22.314 167.314 25 164 25H156C152.686 25 150 22.314 150 19V13Z" />
            <path d="M172 13H175V23C175 23.552 175.448 24 176 24H189V27H176C173.791 27 172 25.209 172 23V13Z" />
            <path d="M191 13H194V27H191V13Z" />
            <path d="M196 13H199L208 23V13H211V27H208L199 17V27H196V13Z" />
            <path d="M222 16C222 14.343 223.343 13 225 13H234C235.657 13 237 14.343 237 16V24C237 25.657 235.657 27 234 27H225C223.343 27 222 25.657 222 24V16ZM225 16V24H234V16H225Z" />
            <path d="M239 13H242C243.105 13 244 13.895 244 15V25C244 26.105 243.105 27 242 27H239V13Z" />
            <path d="M246 13H259C260.105 13 261 13.895 261 15V15C261 16.105 260.105 17 259 17H254V27H251V17H246V13ZM254 16H258V14H254V16Z" />
            <path d="M262 13H275C276.105 13 277 13.895 277 15V15C277 16.105 276.105 17 275 17H270V27H267V17H262V13ZM270 16H274V14H270V16Z" />
          </g>
        )}
      </svg>
    </div>
  )
} 