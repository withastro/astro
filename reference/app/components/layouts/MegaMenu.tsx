import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { ReactNode, useState } from "react"
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"

interface MegaMenuItem {
  label: string
  href?: string
  icon?: ReactNode
  description?: string
  featured?: {
    title: string
    description: string
    href: string
    image?: ReactNode
  }[]
  children?: {
    label: string
    href: string
    icon?: ReactNode
    description?: string
  }[]
}

interface MegaMenuProps {
  items: MegaMenuItem[]
  logo?: ReactNode
  actions?: ReactNode
}

export function MegaMenu({ items, logo, actions }: MegaMenuProps) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index)
  }

  const handleMouseEnter = (index: number) => {
    setOpenMenuIndex(index)
  }

  const handleMouseLeave = () => {
    setOpenMenuIndex(null)
  }

  return (
    <header className="w-full border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {logo && (
            <div className="flex-shrink-0">
              {logo}
            </div>
          )}

          {/* Desktop Navigation */}
          <nav 
            className="hidden lg:flex items-center space-x-1 flex-1 justify-start ml-6" 
            onMouseLeave={handleMouseLeave}
          >
            {items.map((item, index) => (
              <div 
                key={item.label} 
                className="relative"
                onMouseEnter={() => handleMouseEnter(index)}
              >
                {item.href && !item.children ? (
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon && (
                      <span className="mr-2 h-4 w-4">{item.icon}</span>
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleToggle(index)}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus:outline-none",
                      openMenuIndex === index && "bg-accent text-accent-foreground"
                    )}
                  >
                    {item.icon && (
                      <span className="mr-2 h-4 w-4">{item.icon}</span>
                    )}
                    <span>{item.label}</span>
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </button>
                )}

                {/* Dropdown Panel */}
                {item.children && openMenuIndex === index && (
                  <div className="absolute left-0 z-10 mt-1 w-screen max-w-md rounded-md shadow-lg">
                    <div className="bg-white rounded-md ring-1 ring-black ring-opacity-5 overflow-hidden">
                      <div className="relative grid gap-1 p-4 sm:p-6">
                        {item.children.map((child, childIndex) => {
                          // Colors for icons
                          const colors = [
                            "bg-blue-50 text-blue-600",
                            "bg-green-50 text-green-600", 
                            "bg-purple-50 text-purple-600",
                            "bg-amber-50 text-amber-600",
                            "bg-rose-50 text-rose-600"
                          ];
                          const colorClass = colors[childIndex % colors.length];
                          
                          return (
                            <Link
                              key={child.label}
                              href={child.href || "#"}
                              className="flex items-start p-3 rounded-lg hover:bg-muted transition-colors"
                            >
                              {child.icon && (
                                <div className={cn("flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md", colorClass)}>
                                  {child.icon}
                                </div>
                              )}
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">
                                  {child.label}
                                </p>
                                {child.description && (
                                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                    {child.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      
                      {item.featured && item.featured.length > 0 && (
                        <div className="bg-gray-50 p-4 sm:p-6">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                            Empfohlen
                          </h3>
                          <div className="space-y-3">
                            {item.featured.map((feature, featureIndex) => {
                              const featuredColors = [
                                "bg-indigo-50 text-indigo-600",
                                "bg-emerald-50 text-emerald-600",
                                "bg-pink-50 text-pink-600"
                              ];
                              const featuredColor = featuredColors[featureIndex % featuredColors.length];
                              
                              return (
                                <Link
                                  key={feature.title}
                                  href={feature.href || "#"}
                                  className="flex items-center p-3 rounded-lg hover:bg-white transition-colors"
                                >
                                  {feature.image && (
                                    <div className={cn("flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md", featuredColor)}>
                                      {feature.image}
                                    </div>
                                  )}
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">
                                      {feature.title}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                      {feature.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          {/* Actions (Search, buttons, etc.) */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
          
          {/* Mobile menu button - to be implemented with a mobile drawer menu */}
          <div className="lg:hidden flex items-center">
            <button 
              className="p-2 rounded-md inline-flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on mobile menu state */}
      <div className="lg:hidden hidden">
        {/* Mobile menu content goes here */}
      </div>
    </header>
  )
} 