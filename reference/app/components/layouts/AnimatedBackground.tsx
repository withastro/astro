import { useEffect, useRef } from "react"

interface AnimatedBackgroundProps {
  className?: string
  variant?: "gradient" | "mesh" | "noise"
  intensity?: "light" | "medium" | "strong"
  interactive?: boolean
}

export function AnimatedBackground({
  className = "",
  variant = "gradient",
  intensity = "medium",
  interactive = true
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const animationFrameRef = useRef<number>()
  const mousePosition = useRef({ x: 0, y: 0 })
  const particles = useRef<Array<{
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    hue: number
  }>>([])

  const intensityValues = {
    light: { particleCount: 50, opacity: 0.3 },
    medium: { particleCount: 100, opacity: 0.5 },
    strong: { particleCount: 150, opacity: 0.7 }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    contextRef.current = context
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles.current = []
      const { particleCount } = intensityValues[intensity]

      for (let i = 0; i < particleCount; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: Math.random() * 2 - 1,
          speedY: Math.random() * 2 - 1,
          hue: Math.random() * 60 - 30 // Variation in hue
        })
      }
    }

    const drawParticle = (
      particle: typeof particles.current[0],
      context: CanvasRenderingContext2D
    ) => {
      const { opacity } = intensityValues[intensity]
      
      if (variant === "gradient") {
        const gradient = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        )

        gradient.addColorStop(0, `hsla(var(--primary-hsl), ${opacity})`)
        gradient.addColorStop(1, "transparent")
        context.fillStyle = gradient
      } else if (variant === "mesh") {
        context.strokeStyle = `hsla(var(--primary-hsl), ${opacity})`
        context.lineWidth = particle.size / 2
      } else {
        context.fillStyle = `hsla(var(--primary-hsl), ${opacity})`
      }

      if (variant === "mesh") {
        particles.current.forEach((p2) => {
          const distance = Math.hypot(particle.x - p2.x, particle.y - p2.y)
          if (distance < 100) {
            context.beginPath()
            context.moveTo(particle.x, particle.y)
            context.lineTo(p2.x, p2.y)
            context.stroke()
          }
        })
      } else {
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fill()
      }
    }

    const animate = () => {
      if (!contextRef.current || !canvas) return

      contextRef.current.clearRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

        // Interactive movement
        if (interactive) {
          const dx = mousePosition.current.x - particle.x
          const dy = mousePosition.current.y - particle.y
          const distance = Math.hypot(dx, dy)
          
          if (distance < 100) {
            const angle = Math.atan2(dy, dx)
            particle.x -= Math.cos(angle) * 0.5
            particle.y -= Math.sin(angle) * 0.5
          }
        }

        drawParticle(particle, contextRef.current!)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    window.addEventListener("resize", resizeCanvas)
    if (interactive) {
      canvas.addEventListener("mousemove", handleMouseMove)
    }

    resizeCanvas()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (interactive) {
        canvas.removeEventListener("mousemove", handleMouseMove)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [variant, intensity, interactive])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 h-full w-full ${className}`}
      style={{ opacity: intensityValues[intensity].opacity }}
    />
  )
} 