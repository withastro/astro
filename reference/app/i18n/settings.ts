import { defaultLocale, locales } from './config'

/**
 * i18n configuration settings
 */

// Supported locales for the application
export const SUPPORTED_LOCALES = locales

// Default locale (fallback)
export const DEFAULT_LOCALE = defaultLocale

// Locale-specific metadata
export const LOCALE_METADATA = {
  de: { name: 'Deutsch', direction: 'ltr' },
  en: { name: 'English', direction: 'ltr' },
  nl: { name: 'Nederlands', direction: 'ltr' },
  fr: { name: 'Français', direction: 'ltr' },
  it: { name: 'Italiano', direction: 'ltr' },
  es: { name: 'Español', direction: 'ltr' },
  pl: { name: 'Polski', direction: 'ltr' },
  cs: { name: 'Čeština', direction: 'ltr' },
  no: { name: 'Norsk', direction: 'ltr' },
  sv: { name: 'Svenska', direction: 'ltr' },
  da: { name: 'Dansk', direction: 'ltr' },
  zh: { name: '中文', direction: 'ltr' },
  ja: { name: '日本語', direction: 'ltr' }
} 