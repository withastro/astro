'use client'

import { type Locale } from './config'

export function validateLocale(locale: string): locale is Locale {
  return locale.length === 2 && /^[a-z]{2}$/.test(locale)
}

// Client-side cookie helper
export function getClientLocale(): string {
  if (typeof document === 'undefined') return 'en'
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1] || 'en'
}