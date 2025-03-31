import { ReactNode } from "react"
import { WavePattern } from "../svg/WavePattern"
import { Button } from '@/components/ui/button'

interface WaveHeroProps {
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
  background?: "primary" | "secondary" | "none"
}

export function WaveHero({
  title,
  description,
  image,
  primaryAction,
  secondaryAction,
  background = "primary"
}: WaveHeroProps) {
  const backgroundClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    none: "bg-background text-foreground"
  }

  return (
    <div className={`relative overflow-hidden ${backgroundClasses[background]}`}>
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="relative z-10">
            {typeof title === "string" ? (
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                {title}
              </h1>
            ) : (
              title
            )}
            {description && (
              <div className="mt-6 text-lg leading-8 opacity-90">
                {description}
              </div>
            )}
            {(primaryAction || secondaryAction) && (
              <div className="mt-10 flex items-center gap-x-6">
                {primaryAction && (
                  <Button
                    asChild
                    size="lg"
                    variant={background === "primary" ? "secondary" : "default"}
                  >
                    <a href={primaryAction.href}>{primaryAction.label}</a>
                  </Button>
                )}
                {secondaryAction && (
                  <Button
                    asChild
                    size="lg"
                    variant={background === "primary" ? "outline" : "secondary"}
                  >
                    <a href={secondaryAction.href}>{secondaryAction.label}</a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            {image}
          </div>
        </div>
      </div>
      <WavePattern className="absolute bottom-0 left-0 right-0 h-32 w-full transform" />
    </div>
  )
} 