import { cn } from "@/lib/utils"

interface LogoVariant2Props {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function LogoVariant2({
  size = "md",
  className,
  showText = true
}: LogoVariant2Props) {
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
        {/* Circle Chart Icon */}
        <g>
          <circle cx="20" cy="20" r="16" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.3" />
          
          {/* Circular segments */}
          <path 
            d="M20 4 A16 16 0 0 1 36 20" 
            stroke="#3b82f6" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <path 
            d="M36 20 A16 16 0 0 1 20 36" 
            stroke="#f97316" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          <path 
            d="M20 36 A16 16 0 0 1 4 20" 
            stroke="#84cc16" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          
          {/* Central icon */}
          <path 
            d="M15 14L15 26L28 20L15 14Z" 
            fill="#3b82f6"
          />
          
          {/* Data points */}
          <circle cx="28" cy="14" r="2" fill="#f97316" />
          <circle cx="12" cy="26" r="2" fill="#84cc16" />
        </g>

        {/* Text */}
        {showText && (
          <g>
            <path d="M45 20C45 15.5817 48.5817 12 53 12H61C65.4183 12 69 15.5817 69 20C69 24.4183 65.4183 28 61 28H53C48.5817 28 45 24.4183 45 20ZM53 16C50.7909 16 49 17.7909 49 20C49 22.2091 50.7909 24 53 24H61C63.2091 24 65 22.2091 65 20C65 17.7909 63.2091 16 61 16H53Z" fill="#334155" />
            <path d="M71 12H75V22C75 24.2091 76.7909 26 79 26H87C89.2091 26 91 24.2091 91 22V12H95V22C95 26.4183 91.4183 30 87 30H79C74.5817 30 71 26.4183 71 22V12Z" fill="#334155" />
            <path d="M97 12H101V28H97V12Z" fill="#334155" />
            <path d="M107 12H111L119 22V12H123V28H119L111 18V28H107V12Z" fill="#334155" />
            <path d="M125 12H141V16H137V28H133V16H129V28H125V12Z" fill="#334155" />
            <path d="M150 16V24H158V16H150ZM146 12H162V28H146V12Z" fill="#334155" />
            <path d="M166 14C166 12.8954 166.895 12 168 12H180C182.209 12 184 13.7909 184 16V24C184 26.2091 182.209 28 180 28H168C166.895 28 166 27.1046 166 26V14ZM172 16H180C180 16 180 16 180 16V24C180 24 180 24 180 24H170V16H172Z" fill="#334155" />
            <path d="M189 14C189 12.8954 189.895 12 191 12H193.882C196.09 12 198.091 13.3341 198.882 15.3683L201.118 20.6317C201.909 22.6659 203.91 24 206.118 24H209V28H206.118C201.701 28 197.699 25.3317 196.118 21.2634L194.764 18H193V28H189V14ZM193 14V16H195C195 16 195 16 195 16L196.486 19.5366C196.881 20.4558 197.715 21.1149 198.7 21.3171L196.486 16.4634C196.091 15.5442 195.257 14.8851 194.272 14.6829C194.026 14.6277 193.771 14.6 193.516 14.6C193.352 14.6 193.176 14.6 193 14.6V14Z" fill="#334155" />
            <path d="M211 12H227V16H223V28H219V16H215V28H211V12Z" fill="#334155" />
            <path d="M229 12H233V28H229V12Z" fill="#334155" />
            <path d="M235 12H239V22C239 24.2091 240.791 26 243 26H251C253.209 26 255 24.2091 255 22V12H259V22C259 26.4183 255.418 30 251 30H243C238.582 30 235 26.4183 235 22V12Z" fill="#334155" />
            <path d="M265 24C263.343 24 262 22.6569 262 21V12H266V20C266 20 266 20 266 20H274C274 20 274 20 274 20V12H278V21C278 22.6569 276.657 24 275 24H265Z" fill="#334155" />
          </g>
        )}
      </svg>
    </div>
  )
} 