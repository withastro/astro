export const defaultLocale = 'de'

export const locales = [
  'de',    // German (primary)
  'en',    // English
  'nl',    // Dutch
  'fr',    // French
  'it',    // Italian
  'es',    // Spanish
  'pl',    // Polish
  'cs',    // Czech
  'no',    // Norwegian
  'sv',    // Swedish
  'da',    // Danish
  'zh',    // Chinese
  'ja'     // Japanese
] as const

export const namespaces = [
  'common',
  'navigation',
  'seoT',
  'ccT',
  'home',
] as const

export type Locale = typeof locales[number]
export type Namespace = typeof namespaces[number]

export interface Translation {
  id: bigint
  locale: Locale
  namespace: Namespace
  key: string
  value: string
  created_at: Date
  updated_at: Date
}

export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace
} 