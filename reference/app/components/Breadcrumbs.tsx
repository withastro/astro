import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface Crumb {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items: Crumb[]
  homeHref?: string
}

export function Breadcrumbs({ items, homeHref = "/" }: BreadcrumbsProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href={homeHref}
            className="text-muted-foreground hover:text-primary"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            {index === items.length - 1 ? (
              <span className="text-sm font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
} 