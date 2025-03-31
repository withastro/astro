import { ReactNode, useEffect, useRef, useState } from "react"

interface ParallaxLayer {
  content: ReactNode
  speed?: number
  offset?: number
  className?: string
}

interface ParallaxSectionProps {
  layers: ParallaxLayer[]
  className?: string
  height?: string
  perspective?: number
}

export function ParallaxSection({
  layers,
  className = "",
  height = "100vh",
  perspective = 1000
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      
      // Calculate how far through the section we've scrolled (0 to 1)
      const progress = Math.max(0, Math.min(1, 
        1 - (rect.bottom / (viewportHeight + rect.height))
      ))
      
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div
      ref={sectionRef}
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="absolute inset-0"
        style={{
          perspective: `${perspective}px`,
          perspectiveOrigin: "50% 50%"
        }}
      >
        {layers.map((layer, index) => (
          <div
            key={index}
            className={`absolute inset-0 will-change-transform ${layer.className || ""}`}
            style={{
              transform: `translateZ(${(layer.offset || 0) * perspective}px) 
                         translateY(${scrollProgress * (layer.speed || 0)}px)`
            }}
          >
            {layer.content}
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
} 