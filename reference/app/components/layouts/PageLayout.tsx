"use client"

import { ReactNode } from "react"

interface PageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  padding?: "none" | "sm" | "md" | "lg"
}

export function PageLayout({
  children,
  sidebar,
  header,
  footer,
  maxWidth = "2xl",
  padding = "lg"
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full"
  }

  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  }

  return (
    <div className="min-h-screen bg-background">
      {header && <header className="sticky top-0 z-40 w-full">{header}</header>}
      
      <div className="flex min-h-[calc(100vh-4rem)]">
        {sidebar && (
          <aside className="w-64 border-r bg-muted/50">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1">
          <div
            className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]}`}
          >
            {children}
          </div>
        </main>
      </div>

      {footer && <footer className="border-t">{footer}</footer>}
    </div>
  )
} 