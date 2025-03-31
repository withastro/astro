import { motion } from "framer-motion"
import { ReactNode, useRef, useState } from "react"
import { Card } from "@/components/ui/card"

interface FloatingCard {
  title: string
  description: string
  icon?: ReactNode
  href?: string
  color?: "default" | "primary" | "secondary"
}

interface FloatingCardsProps {
  cards: FloatingCard[]
  className?: string
}

export function FloatingCards({ cards, className = "" }: FloatingCardsProps) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {cards.map((card, index) => (
        <FloatingCardItem
          key={card.title}
          card={card}
          index={index}
        />
      ))}
    </div>
  )
}

function FloatingCardItem({ card, index }: { card: FloatingCard; index: number }) {
  const [transform, setTransform] = useState("")
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) / 20
    const rotateY = (centerX - x) / 20

    setTransform(`
      perspective(1000px)
      scale3d(1.05, 1.05, 1.05)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
    `)
  }

  const handleMouseLeave = () => {
    setTransform("")
  }

  const colorClasses = {
    default: "bg-card hover:bg-card/90",
    primary: "bg-primary/10 hover:bg-primary/20",
    secondary: "bg-secondary/10 hover:bg-secondary/20"
  }

  const Wrapper = card.href ? "a" : "div"

  return (
    <Wrapper
      ref={cardRef}
      href={card.href}
      className={`group relative overflow-hidden rounded-xl p-8 transition-all duration-300 ease-out hover:shadow-lg ${
        colorClasses[card.color || "default"]
      }`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          animation: "gradient 8s linear infinite",
          backgroundSize: "200% 100%"
        }}
      />

      {/* Floating dots */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {[...Array(20)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 100}
              cy={Math.random() * 100}
              r="0.5"
              fill="currentColor"
              className="animate-pulse opacity-20"
              style={{
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10">
        {card.icon && (
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {card.icon}
          </div>
        )}
        <h3 className="mb-2 text-xl font-semibold">{card.title}</h3>
        <p className="text-muted-foreground">{card.description}</p>
      </div>

      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 h-32 w-32 -translate-x-8 translate-y-8 rotate-12 bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-transform duration-500 group-hover:translate-y-6" />
    </Wrapper>
  )
}

// Add keyframes to your global CSS or Tailwind config
const styles = `
  @keyframes gradient {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
` 