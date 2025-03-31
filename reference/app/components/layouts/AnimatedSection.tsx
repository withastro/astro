import { ReactNode } from "react"
import { AnimatedBackground } from "./AnimatedBackground"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  backgroundVariant?: "gradient" | "mesh" | "noise"
  backgroundIntensity?: "light" | "medium" | "strong"
  interactive?: boolean
  pattern?: "none" | "dots" | "grid"
  containerWidth?: "default" | "wide" | "full"
  verticalPadding?: "small" | "medium" | "large"
}

export function AnimatedSection({
  children,
  className = "",
  backgroundVariant = "gradient",
  backgroundIntensity = "medium",
  interactive = true,
  pattern = "none",
  containerWidth = "default",
  verticalPadding = "medium"
}: AnimatedSectionProps) {
  const containerClasses = {
    default: "max-w-7xl",
    wide: "max-w-[1400px]",
    full: "max-w-none"
  }

  const paddingClasses = {
    small: "py-8 sm:py-12",
    medium: "py-16 sm:py-24",
    large: "py-24 sm:py-32"
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Animated background */}
      <AnimatedBackground
        variant={backgroundVariant}
        intensity={backgroundIntensity}
        interactive={interactive}
      />

      {/* Optional patterns */}
      {pattern === "dots" && (
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>
      )}

      {pattern === "grid" && (
        <div className="absolute inset-0 -z-10">
          <div
            className="h-full w-full opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                               linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: "24px 24px"
            }}
          />
        </div>
      )}

      {/* Content container */}
      <div
        className={`relative mx-auto px-6 lg:px-8 ${containerClasses[containerWidth]} ${paddingClasses[verticalPadding]}`}
      >
        <div className="relative z-10">
          {children}
        </div>

        {/* Optional decorative elements */}
        <div className="pointer-events-none absolute left-12 top-1/2 -z-10 -translate-y-1/2 blur-3xl">
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary/30 to-secondary/30 opacity-20"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
            }}
          />
        </div>
      </div>
    </section>
  )
} 