import { useEffect, useRef } from "react"

interface ParticleTextProps {
  text: string
  className?: string
  particleSize?: number
  particleSpacing?: number
  color?: string
  mouseForce?: number
  particleSpeed?: number
}

interface Particle {
  x: number
  y: number
  originX: number
  originY: number
  size: number
  color: string
  dx: number
  dy: number
  vx: number
  vy: number
  force: number
  angle: number
  distance: number
  friction: number
  ease: number
}

export function ParticleText({
  text,
  className = "",
  particleSize = 2,
  particleSpacing = 3,
  color = "currentColor",
  mouseForce = 0.1,
  particleSpeed = 0.3
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    updateSize()
    window.addEventListener("resize", updateSize)

    // Create text particles
    const createTextParticles = () => {
      ctx.font = "bold 100px sans-serif"
      ctx.fillStyle = "transparent"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const textHeight = 100 // Approximate height based on font size

      // Draw text to get pixel data
      ctx.fillText(
        text,
        canvas.width / (2 * window.devicePixelRatio),
        canvas.height / (2 * window.devicePixelRatio)
      )
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      particlesRef.current = []

      // Sample pixels to create particles
      for (let y = 0; y < canvas.height; y += particleSpacing * window.devicePixelRatio) {
        for (let x = 0; x < canvas.width; x += particleSpacing * window.devicePixelRatio) {
          const index = (y * canvas.width + x) * 4
          const alpha = pixels[index + 3]

          if (alpha > 0) {
            const particle: Particle = {
              x: x / window.devicePixelRatio,
              y: y / window.devicePixelRatio,
              originX: x / window.devicePixelRatio,
              originY: y / window.devicePixelRatio,
              size: particleSize,
              color,
              dx: 0,
              dy: 0,
              vx: 0,
              vy: 0,
              force: 0,
              angle: 0,
              distance: 0,
              friction: 0.95,
              ease: 0.1
            }
            particlesRef.current.push(particle)
          }
        }
      }
    }

    createTextParticles()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        // Calculate force from mouse
        const dx = mouseRef.current.x - particle.x
        const dy = mouseRef.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const force = Math.max((100 - distance) / 100, 0)

        particle.angle = Math.atan2(dy, dx)
        particle.force = force

        // Update particle position
        if (force > 0) {
          particle.vx += Math.cos(particle.angle) * particle.force * mouseForce
          particle.vy += Math.sin(particle.angle) * particle.force * mouseForce
        }

        particle.x += (particle.vx *= particle.friction) + (particle.originX - particle.x) * particle.ease
        particle.y += (particle.vy *= particle.friction) + (particle.originY - particle.y) * particle.ease

        // Draw particle
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    canvas.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("resize", updateSize)
      canvas.removeEventListener("mousemove", handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [text, particleSize, particleSpacing, color, mouseForce, particleSpeed])

  return (
    <canvas
      ref={canvasRef}
      className={`h-[200px] w-full ${className}`}
      style={{ touchAction: "none" }}
    />
  )
} 