import Link from 'next/link'
import LanguageSelector from './LanguageSelector'
import { getLocaleFromCookie } from '../i18n/utils'

export function Header() {
  const locale = getLocaleFromCookie()

  return (
    <div className="container flex h-14 items-center">
      <div className="mr-4 hidden md:flex">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">
            Enterprise App
          </span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href={`/${locale}/dashboard`}
            className="transition-colors hover:text-foreground/80"
          >
            Dashboard
          </Link>
          <Link
            href={`/${locale}/projects`}
            className="transition-colors hover:text-foreground/80"
          >
            Projects
          </Link>
          <Link
            href={`/${locale}/settings`}
            className="transition-colors hover:text-foreground/80"
          >
            Settings
          </Link>
        </nav>
      </div>
      <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <div className="w-full flex-1 md:w-auto md:flex-none">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
} 