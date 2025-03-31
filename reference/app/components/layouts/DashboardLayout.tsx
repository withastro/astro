import {
  BarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X
} from "lucide-react"
import Link from "next/link"
import { ReactNode , useState } from "react"
import { PageLayout } from "./PageLayout"
import { Card } from "../ui/card"


interface NavItem {
  label: string
  href: string
  icon: ReactNode
}

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}

export function DashboardLayout({
  children,
  title,
  description,
  actions
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart className="h-5 w-5" />
    },
    {
      label: "Users",
      href: "/dashboard/users",
      icon: <Users className="h-5 w-5" />
    },
    {
      label: "Content",
      href: "/dashboard/content",
      icon: <FileText className="h-5 w-5" />
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ]

  const renderNavItems = () => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-muted"
        >
          {item.icon}
          <span className="ml-3">{item.label}</span>
        </Link>
      ))}
    </nav>
  )

  const renderHeader = () => (
    <div className="flex h-16 items-center justify-between px-4 border-b">
      <div className="flex items-center">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted lg:hidden"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        <div className="ml-4 lg:ml-0">
          <Link href="/dashboard" className="text-xl font-semibold">
            Dashboard
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center text-sm hover:text-primary">
          <LogOut className="h-5 w-5 mr-2" />
          Sign out
        </button>
      </div>
    </div>
  )

  const renderSidebar = () => (
    <div className="h-full py-6">
      <div className="px-4 mb-6">
        <Link href="/dashboard" className="text-xl font-semibold">
          Your Logo
        </Link>
      </div>
      {renderNavItems()}
    </div>
  )

  return (
    <PageLayout
      header={renderHeader()}
      sidebar={renderSidebar()}
      maxWidth="full"
      padding="md"
    >
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-background">
            {renderSidebar()}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {(title || description || actions) && (
          <Card>
            <div className="p-6">
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
        )}

        {children}
      </div>
    </PageLayout>
  )
} 