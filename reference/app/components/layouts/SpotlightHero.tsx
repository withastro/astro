import { ReactNode, useEffect, useRef, useState } from "react"
import { GridPattern } from "../svg/GridPattern"
import { Button } from '@/components/ui/button'

interface SpotlightHeroProps {
  title: string | ReactNode
  description?: string | ReactNode
  image?: ReactNode
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function SpotlightHero({
  title,
  description,
  image,
  primaryAction,
  secondaryAction,
}: SpotlightHeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return

      const rect = heroRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePosition({ x, y })
    }

    const element = heroRef.current
    if (element) {
      element.addEventListener("mousemove", handleMouseMove)
      return () => element.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={heroRef}
      className="relative min-h-[600px] overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 -z-10">
        <GridPattern className="absolute h-full w-full opacity-50" />
      </div>

      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(var(--primary-rgb), 0.1), transparent 40%)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <div className="relative z-10">
            {typeof title === "string" ? (
              <h1 className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
                {title}
              </h1>
            ) : (
              title
            )}
            {description && (
              <div className="mt-6 text-lg leading-8 text-muted-foreground">
                {description}
              </div>
            )}
            {(primaryAction || secondaryAction) && (
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {primaryAction && (
                  <Button
                    asChild
                    size="lg"
                    className="relative overflow-hidden transition-transform hover:scale-105"
                  >
                    <a href={primaryAction.href}>
                      <span className="relative z-10">{primaryAction.label}</span>
                      <div className="absolute inset-0 -z-10 animate-pulse bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-75" />
                    </a>
                  </Button>
                )}
                {secondaryAction && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="transition-transform hover:scale-105"
                  >
                    <a href={secondaryAction.href}>{secondaryAction.label}</a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {image && (
          <div className="mt-16 flow-root sm:mt-24">
            <div className="relative -m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <div className="relative rounded-md shadow-2xl ring-1 ring-gray-900/10">
                {image}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 