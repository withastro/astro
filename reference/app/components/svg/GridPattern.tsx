export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 1200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="gridPattern"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M.5.5h40v40H.5z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.05"
          />
        </pattern>
        <radialGradient
          id="glowGradient"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background grid */}
      <rect width="100%" height="100%" fill="url(#gridPattern)" />

      {/* Animated dots */}
      <g className="animate-[pulse_4s_ease-in-out_infinite]" filter="url(#glow)">
        <circle cx="400" cy="400" r="4" fill="currentColor" />
        <circle cx="800" cy="400" r="4" fill="currentColor" />
        <circle cx="600" cy="600" r="4" fill="currentColor" />
        <circle cx="200" cy="800" r="4" fill="currentColor" />
        <circle cx="1000" cy="800" r="4" fill="currentColor" />
      </g>

      {/* Gradient overlay */}
      <rect
        width="100%"
        height="100%"
        fill="url(#glowGradient)"
        className="animate-[pulse_6s_ease-in-out_infinite]"
      />
    </svg>
  )
} 