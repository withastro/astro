import { cn } from "@/lib/utils"

interface LogoVariant1Props {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function LogoVariant1({
  size = "md",
  className,
  showText = true
}: LogoVariant1Props) {
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
        {/* Hexagon Icon */}
        <g>
          <path 
            d="M13 7L7 20L13 33H27L33 20L27 7H13Z" 
            fill="#2563EB" 
            fillOpacity="0.1"
            stroke="#2563EB"
            strokeWidth="2"
          />
          <path 
            d="M18 15L15 20L18 25H24L27 20L24 15H18Z" 
            fill="#2563EB" 
          />
          <path 
            d="M20 12.5L17 20L20 27.5" 
            stroke="white" 
            strokeWidth="1" 
            strokeLinecap="round"
          />
          <path 
            d="M15 20H25" 
            stroke="white" 
            strokeWidth="1" 
            strokeLinecap="round"
            strokeDasharray="1 2"
          />
          <circle cx="20" cy="20" r="2" fill="white" />
        </g>

        {/* Text */}
        {showText && (
          <g fill="#2563EB">
            <path d="M45 12H65C67.2 12 69 13.8 69 16V16C69 18.2 67.2 20 65 20H49V24C49 26.2 50.8 28 53 28H65V24H53V24H65V20" />
            <path d="M71 12H75V22C75 25.3 77.7 28 81 28C84.3 28 87 25.3 87 22V12H91V22C91 27.5 86.5 32 81 32C75.5 32 71 27.5 71 22V12Z" />
            <path d="M93 12H97V28H93V12Z" />
            <path d="M100 12H104V20L112 12H117L108 21L117 28H112L104 21V28H100V12Z" />
            <path d="M119 12H123V24H131V28H119V12Z" />
            <path d="M135 16V24H143V16H135ZM131 12H147V28H131V12Z" />
            <path d="M149 12H153V28H149V12Z" />
            <path d="M155 12H159V20L167 12H172L163 21L172 28H167L159 21V28H155V12Z" />
            <path d="M173 12H192V16H185V28H181V16H173V12Z" />
            <path d="M193 12H197V20C197 24.4 200.6 28 205 28C209.4 28 213 24.4 213 20V12H217V20C217 26.6 211.6 32 205 32C198.4 32 193 26.6 193 20V12Z" />
            <path d="M225 12H240C242.2 12 244 13.8 244 16V18C244 20.2 242.2 22 240 22H229V28H225V12ZM229 18H238C239.1 18 240 17.1 240 16V16C240 14.9 239.1 14 238 14H229V18Z" />
            <path d="M246 12H250V24H258V28H246V12Z" />
          </g>
        )}
      </svg>
    </div>
  )
} 