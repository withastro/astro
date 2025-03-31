import Link from 'next/link'
import { getLocaleFromCookie } from '../i18n/utils'

export function Sidebar() {
  const locale = getLocaleFromCookie()

  const navigation = [
    {
      title: 'Overview',
      links: [
        { href: `/${locale}/dashboard`, label: 'Dashboard' },
        { href: `/${locale}/analytics`, label: 'Analytics' },
      ],
    },
    {
      title: 'Projects',
      links: [
        { href: `/${locale}/projects`, label: 'All Projects' },
        { href: `/${locale}/projects/active`, label: 'Active' },
        { href: `/${locale}/projects/completed`, label: 'Completed' },
      ],
    },
    {
      title: 'Settings',
      links: [
        { href: `/${locale}/settings/profile`, label: 'Profile' },
        { href: `/${locale}/settings/account`, label: 'Account' },
        { href: `/${locale}/settings/notifications`, label: 'Notifications' },
      ],
    },
  ]

  return (
    <div className="space-y-6 py-6 px-4">
      {navigation.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3 className="text-sm font-medium">{section.title}</h3>
          <nav className="flex flex-col space-y-2">
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </div>
  )
} 