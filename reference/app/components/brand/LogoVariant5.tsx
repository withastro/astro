import { cn } from "@/lib/utils"

interface LogoVariant5Props {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function LogoVariant5({
  size = "md",
  className,
  showText = true
}: LogoVariant5Props) {
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
        {/* Search Magnifier Icon */}
        <g>
          {/* Magnifier glass */}
          <circle cx="16" cy="16" r="10" stroke="#334155" strokeWidth="2.5" fill="none" />
          <circle cx="16" cy="16" r="6" fill="#38bdf8" fillOpacity="0.3" />
          
          {/* Handle */}
          <line 
            x1="24" 
            y1="24" 
            x2="32" 
            y2="32" 
            stroke="#334155" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
          
          {/* Graph in magnifier */}
          <path 
            d="M12 20L14 17L16 18L18 15L20 16" 
            stroke="#0284c7" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
          
          {/* Keywords/Tags */}
          <rect x="10" y="28" width="8" height="3" rx="1.5" fill="#94a3b8" />
          <rect x="20" y="28" width="12" height="3" rx="1.5" fill="#94a3b8" />
          <rect x="24" y="10" width="10" height="3" rx="1.5" fill="#94a3b8" />
          <rect x="28" y="16" width="6" height="3" rx="1.5" fill="#94a3b8" />
        </g>

        {/* Text */}
        {showText && (
          <g fill="#0f172a">
            <path d="M45 20C45 15.0294 49.0294 11 54 11H60C64.9706 11 69 15.0294 69 20C69 24.9706 64.9706 29 60 29H54C49.0294 29 45 24.9706 45 20ZM54 15C51.2386 15 49 17.2386 49 20C49 22.7614 51.2386 25 54 25H60C62.7614 25 65 22.7614 65 20C65 17.2386 62.7614 15 60 15H54Z" />
            <path d="M71 11H75V20C75 22.7614 77.2386 25 80 25H86C88.7614 25 91 22.7614 91 20V11H95V20C95 24.9706 90.9706 29 86 29H80C75.0294 29 71 24.9706 71 20V11Z" />
            <path d="M97 11H101V29H97V11Z" />
            <path d="M103 11H107L116 22V11H120V29H116L107 18V29H103V11Z" />
            <path d="M122 11H126V29H122V11Z" />
            <path d="M128 11H132V20C132 22.7614 134.239 25 137 25H143C145.761 25 148 22.7614 148 20V11H152V20C152 24.9706 147.971 29 143 29H137C132.029 29 128 24.9706 128 20V11Z" />
            <path d="M154 11H158V29H154V11Z" />
            <path d="M170 11H183C184.105 11 185 11.8954 185 13V27C185 28.1046 184.105 29 183 29H170V11ZM174 15V25H181V15H174Z" />
            <path d="M194 15L186 15V25H194V15ZM198 29H182V11H198V29Z" />
            <path d="M200 11H204V21C204 22.1046 204.895 23 206 23H212V20H206V17H216V27C216 28.1046 215.105 29 214 29H206C202.686 29 200 26.3137 200 23V11Z" />
            <path d="M218 11H222V16H231V11H235V29H231V20H222V29H218V11Z" />
            <path d="M237 11H241V29H237V11Z" />
            <path d="M243 11H256C257.105 11 258 11.8954 258 13V13C258 14.1046 257.105 15 256 15H247V19H256C257.105 19 258 19.8954 258 21V27C258 28.1046 257.105 29 256 29H243V25H254V23H243V11Z" />
          </g>
        )}
      </svg>
    </div>
  )
} 