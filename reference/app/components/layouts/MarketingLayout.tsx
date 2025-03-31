"use client"

import { Menu, X } from "lucide-react"
import { ReactNode, useState } from "react"
import { PageLayout } from "./PageLayout"
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
}

interface MarketingLayoutProps {
  children: ReactNode
  logo?: ReactNode
  navigation?: NavItem[]
  actions?: ReactNode
  footerNavigation?: {
    [key: string]: NavItem[]
  }
  footerText?: string
}

export function MarketingLayout({
  children,
  logo,
  navigation,
  actions,
  footerNavigation,
  footerText
}: MarketingLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const renderNavigation = () => (
    <nav className="hidden md:flex items-center space-x-8">
      {navigation?.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          {item.label}
        </a>
      ))}
    </nav>
  )

  const renderMobileMenu = () => (
    <div className={`
      fixed inset-0 z-50 bg-background md:hidden
      ${isMobileMenuOpen ? "block" : "hidden"}
    `}>
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background px-6 py-6">
        <div className="flex items-center justify-between">
          {logo}
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 flow-root">
          <div className="space-y-2 py-6">
            {navigation?.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </div>
          {actions && (
            <div className="py-6">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderHeader = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          {logo}
          {renderNavigation()}
        </div>
        <div className="flex items-center gap-4">
          {actions && <div className="hidden md:block">{actions}</div>}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  )

  const renderFooter = () => (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerNavigation && Object.entries(footerNavigation).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {footerText && (
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            {footerText}
          </div>
        )}
      </div>
    </footer>
  )

  return (
    <PageLayout
      maxWidth="full"
      padding="none"
      header={renderHeader()}
      footer={renderFooter()}
    >
      {renderMobileMenu()}
      {children}
    </PageLayout>
  )
} 