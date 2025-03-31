export function AbstractShapes({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="400" cy="300" r="250" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
      <path
        d="M200 150C200 150 350 50 500 150C650 250 600 400 500 450C400 500 300 450 250 400C200 350 150 250 200 150Z"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="2"
      />
      <path
        d="M600 450C600 450 450 550 300 450C150 350 200 200 300 150C400 100 500 150 550 200C600 250 650 350 600 450Z"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="2"
      />
      <circle cx="400" cy="300" r="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
      <circle cx="400" cy="300" r="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
      <circle cx="400" cy="300" r="25" fill="currentColor" fillOpacity="0.1" />
    </svg>
  )
} 