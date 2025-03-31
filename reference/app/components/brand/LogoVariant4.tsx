import { cn } from "@/lib/utils"

interface LogoVariant4Props {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function LogoVariant4({
  size = "md",
  className,
  showText = true
}: LogoVariant4Props) {
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
        {/* Globe Network Icon */}
        <g>
          {/* Globe */}
          <circle cx="20" cy="20" r="16" fill="#e0f2fe" />
          <ellipse cx="20" cy="20" rx="16" ry="8" stroke="#3b82f6" strokeWidth="0.75" fill="none" />
          <ellipse cx="20" cy="20" rx="8" ry="16" stroke="#3b82f6" strokeWidth="0.75" fill="none" />
          <circle cx="20" cy="20" r="16" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
          
          {/* Network Nodes */}
          <circle cx="12" cy="12" r="2" fill="#0ea5e9" />
          <circle cx="28" cy="16" r="2" fill="#0ea5e9" />
          <circle cx="20" cy="32" r="2" fill="#0ea5e9" />
          <circle cx="8" cy="24" r="2" fill="#0ea5e9" />
          <circle cx="32" cy="28" r="2" fill="#0ea5e9" />
          
          {/* Network Lines */}
          <line x1="12" y1="12" x2="20" y2="32" stroke="#0ea5e9" strokeWidth="0.75" />
          <line x1="12" y1="12" x2="28" y2="16" stroke="#0ea5e9" strokeWidth="0.75" />
          <line x1="8" y1="24" x2="28" y2="16" stroke="#0ea5e9" strokeWidth="0.75" />
          <line x1="8" y1="24" x2="32" y2="28" stroke="#0ea5e9" strokeWidth="0.75" />
          <line x1="20" y1="32" x2="32" y2="28" stroke="#0ea5e9" strokeWidth="0.75" />
          
          {/* Central Node */}
          <circle cx="20" cy="20" r="3" fill="#1e40af" />
          <circle cx="20" cy="20" r="5" stroke="#1e40af" strokeWidth="0.75" fill="none" />
        </g>

        {/* Text */}
        {showText && (
          <g>
            <path d="M45 20C45 15.029 49.029 11 54 11H60C64.971 11 69 15.029 69 20C69 24.971 64.971 29 60 29H54C49.029 29 45 24.971 45 20ZM54 15C51.239 15 49 17.239 49 20C49 22.761 51.239 25 54 25H60C62.761 25 65 22.761 65 20C65 17.239 62.761 15 60 15H54Z" fill="#1e3a8a" />
            <path d="M71 11H75V20C75 22.761 77.239 25 80 25H86C88.761 25 91 22.761 91 20V11H95V20C95 25.523 90.523 30 85 30H81C75.477 30 71 25.523 71 20V11Z" fill="#1e3a8a" />
            <path d="M97 11H101V29H97V11Z" fill="#1e3a8a" />
            <path d="M103 11H107L116 22V11H120V29H116L107 18V29H103V11Z" fill="#1e3a8a" />
            <path d="M123 11H140V15H132V29H128V15H123V11Z" fill="#1e3a8a" />
            <path d="M142 20C142 15.029 146.029 11 151 11H157C161.971 11 166 15.029 166 20C166 24.971 161.971 29 157 29H151C146.029 29 142 24.971 142 20ZM151 15C148.239 15 146 17.239 146 20C146 22.761 148.239 25 151 25H157C159.761 25 162 22.761 162 20C162 17.239 159.761 15 157 15H151Z" fill="#1e3a8a" />
            <path d="M168 11H179C182.866 11 186 14.134 186 18V18C186 19.398 185.552 20.713 184.783 21.783L188 29H183.721L181 23C180.686 23 180.351 22.959 180 22.879V29H176V11ZM180 19H179C176.791 19 175 17.209 175 15V15C175 12.791 176.791 11 179 11H180V19Z" fill="#1e3a8a" />
            <path d="M189 11H199C202.866 11 206 14.134 206 18V18C206 21.866 202.866 25 199 25H193V29H189V11ZM193 21H199C200.657 21 202 19.657 202 18V18C202 16.343 200.657 15 199 15H193V21Z" fill="#1e3a8a" />
            <path d="M208 11H224V15H216V18H223V22H216V25H224V29H208V11Z" fill="#1e3a8a" />
            <path d="M226 11H230V29H226V11Z" fill="#1e3a8a" />
            <path d="M232 11H236L245 22V11H249V29H245L236 18V29H232V11Z" fill="#1e3a8a" />
            <path d="M252 15C252 12.791 253.791 11 256 11H272C274.209 11 276 12.791 276 15V25C276 27.209 274.209 29 272 29H256C253.791 29 252 27.209 252 25V15ZM256 15V25H272V15H256Z" fill="#1e3a8a" />
          </g>
        )}
      </svg>
    </div>
  )
} 