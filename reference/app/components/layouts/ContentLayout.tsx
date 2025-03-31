import { ChevronRight } from "lucide-react"
import { ReactNode } from "react"
import { PageLayout } from "./PageLayout"
import { Card } from "../ui/Card"

interface TableOfContents {
  id: string
  title: string
  level: number
  children?: TableOfContents[]
}

interface ContentLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  tableOfContents?: TableOfContents[]
  breadcrumbs?: { label: string; href: string }[]
  actions?: ReactNode
  aside?: ReactNode
}

export function ContentLayout({
  children,
  title,
  description,
  tableOfContents,
  breadcrumbs,
  actions,
  aside
}: ContentLayoutProps) {
  const renderTableOfContents = (items: TableOfContents[], level = 0) => (
    <ul className={level === 0 ? "space-y-1" : "ml-4 mt-1 space-y-1"}>
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="block py-1 text-sm text-muted-foreground hover:text-primary"
          >
            {item.title}
          </a>
          {item.children && renderTableOfContents(item.children, level + 1)}
        </li>
      ))}
    </ul>
  )

  const renderBreadcrumbs = () => (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs?.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          <a href={item.href} className="hover:text-primary">
            {item.label}
          </a>
        </div>
      ))}
    </nav>
  )

  const renderHeader = () => (
    <Card>
      <div className="p-6">
        {breadcrumbs && (
          <div className="mb-4">
            {renderBreadcrumbs()}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-2xl font-semibold">{title}</h1>}
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="ml-4">{actions}</div>}
        </div>
      </div>
    </Card>
  )

  const renderSidebar = () => (
    <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto p-6">
      {tableOfContents && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium">On this page</h4>
          {renderTableOfContents(tableOfContents)}
        </div>
      )}
      {aside}
    </div>
  )

  return (
    <PageLayout
      maxWidth="full"
      padding="md"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr,240px]">
        <div className="space-y-6">
          {(title || description || actions || breadcrumbs) && renderHeader()}
          <div className="prose max-w-none">
            {children}
          </div>
        </div>
        {(tableOfContents || aside) && (
          <div className="hidden md:block">
            {renderSidebar()}
          </div>
        )}
      </div>
    </PageLayout>
  )
} 