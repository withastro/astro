import { ReactNode } from "react"
import { AbstractShapes } from "../svg/AbstractShapes"
import { Button } from '@/components/ui/button'

interface HeroBannerProps {
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
  pattern?: "abstract" | "none"
}

export function HeroBanner({
  title,
  description,
  image,
  primaryAction,
  secondaryAction,
  pattern = "abstract"
}: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden bg-background py-24 sm:py-32">
      {pattern === "abstract" && (
        <div className="absolute inset-0 -z-10 opacity-50">
          <AbstractShapes className="absolute left-[calc(50%-18rem)] top-10 h-[36rem] w-[72rem] -translate-x-1/2 stroke-blue-500/20 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-[calc(50%-30rem)] sm:h-[42rem]" />
          <div className="absolute -top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
          <div className="absolute -bottom-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative z-10">
            {typeof title === "string" ? (
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
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
                  <Button asChild size="lg">
                    <a href={primaryAction.href}>{primaryAction.label}</a>
                  </Button>
                )}
                {secondaryAction && (
                  <Button asChild variant="outline" size="lg">
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