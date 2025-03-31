import { DEFAULT_LOCALE, LOCALE_METADATA, SUPPORTED_LOCALES } from '@/app/i18n/settings'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface ContentItem {
  id: number
  contentType: ContentType
  slug: string
  locale: string
  title: string
  description?: string
}

interface CanonicalUrlOptions {
  baseUrl?: string
  useHttps?: boolean
  includeWww?: boolean
}

/**
 * Default options for canonical URL generation
 */
const defaultOptions: CanonicalUrlOptions = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
  useHttps: true,
  includeWww: true
}

/**
 * Generates the canonical URL for a content item
 */
export function getCanonicalUrl(
  locale: string, 
  contentType: ContentType, 
  slug: string,
  options: CanonicalUrlOptions = {}
): string {
  // Merge provided options with defaults
  const { baseUrl, useHttps, includeWww } = { ...defaultOptions, ...options }
  
  // Determine the protocol
  const protocol = useHttps ? 'https' : 'http'
  
  // Format the domain part
  let domain = baseUrl || ''
  if (!domain.includes('://')) {
    domain = includeWww && !domain.startsWith('www.') 
      ? `www.${domain}` 
      : domain
  }
  
  // Remove any protocol if present, as we'll add our own
  domain = domain.replace(/^https?:\/\//, '')
  
  // Construct the full URL
  return `${protocol}://${domain}/${locale}/${contentType}/${slug}`
}

/**
 * Formats a locale for hreflang attribute
 * Some locales need special formatting (e.g., en-US instead of en)
 */
export function formatHreflangLocale(locale: string): string {
  // Special cases for specific locales
  switch (locale) {
    case 'en':
      return 'en-us' // Assuming English is US English
    case 'de': 
      return 'de-de' // Assuming German is Germany German
    case 'fr':
      return 'fr-fr' // Assuming French is France French
    case 'it':
      return 'it-it' // Assuming Italian is Italy Italian
    case 'es':
      return 'es-es' // Assuming Spanish is Spain Spanish
    default:
      return locale
  }
}

/**
 * Generates hreflang tags for all available localized versions of a content
 */
export function generateHreflangTags(
  contentId: number,
  contentType: ContentType,
  localizedSlugs: Record<string, string>,
  options: CanonicalUrlOptions = {}
): { 
  locale: string; 
  hreflang: string; 
  url: string 
}[] {
  const tags: { locale: string; hreflang: string; url: string }[] = []
  
  // Add entry for each available locale
  for (const locale of SUPPORTED_LOCALES) {
    // Only include locales that have a translated slug
    if (localizedSlugs[locale]) {
      tags.push({
        locale,
        hreflang: formatHreflangLocale(locale),
        url: getCanonicalUrl(locale, contentType, localizedSlugs[locale], options)
      })
    }
  }
  
  // Add x-default hreflang pointing to the default locale
  if (localizedSlugs[DEFAULT_LOCALE]) {
    tags.push({
      locale: DEFAULT_LOCALE,
      hreflang: 'x-default',
      url: getCanonicalUrl(DEFAULT_LOCALE, contentType, localizedSlugs[DEFAULT_LOCALE], options)
    })
  }
  
  return tags
}

/**
 * Generates Open Graph locale tags for all available localized versions
 */
export function generateOpenGraphLocaleTags(
  contentId: number,
  contentType: ContentType,
  localizedSlugs: Record<string, string>,
  options: CanonicalUrlOptions = {}
): { 
  locale: string; 
  url: string 
}[] {
  const tags: { locale: string; url: string }[] = []
  
  // Add entry for each available locale
  for (const locale of SUPPORTED_LOCALES) {
    // Only include locales that have a translated slug
    if (localizedSlugs[locale]) {
      tags.push({
        locale: formatHreflangLocale(locale).replace('-', '_'),
        url: getCanonicalUrl(locale, contentType, localizedSlugs[locale], options)
      })
    }
  }
  
  return tags
}

interface StructuredDataTranslation {
  "@type": "Language";
  "name": string;
  "alternateName": string;
  "url": string;
}

interface StructuredData {
  "@context": "https://schema.org";
  "@type": string;
  "@id": string;
  "url": string;
  "name": string;
  "inLanguage": string;
  "description"?: string;
  "translationOfWork"?: StructuredDataTranslation[];
}

/**
 * Generates structured data with language attributes
 */
export function generateStructuredData(
  content: ContentItem,
  localizedSlugs: Record<string, string>,
  options: CanonicalUrlOptions = {}
): StructuredData {
  const canonicalUrl = getCanonicalUrl(
    content.locale, 
    content.contentType, 
    content.slug,
    options
  )
  
  // Base structured data
  const structuredData: StructuredData = {
    "@context": "https://schema.org",
    "@type": getSchemaTypeForContentType(content.contentType),
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "name": content.title,
    "inLanguage": formatHreflangLocale(content.locale)
  }
  
  // Add description if available
  if (content.description) {
    structuredData.description = content.description
  }
  
  // Add translations
  const translations: StructuredDataTranslation[] = []
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale !== content.locale && localizedSlugs[locale]) {
      translations.push({
        "@type": "Language",
        "name": LOCALE_METADATA[locale]?.name || locale,
        "alternateName": formatHreflangLocale(locale),
        "url": getCanonicalUrl(locale, content.contentType, localizedSlugs[locale], options)
      })
    }
  }
  
  if (translations.length > 0) {
    structuredData.translationOfWork = translations
  }
  
  return structuredData
}

/**
 * Helper to map content types to Schema.org types
 */
function getSchemaTypeForContentType(contentType: ContentType): string {
  switch (contentType) {
    case 'blog':
      return 'BlogPosting'
    case 'project':
      return 'Project'
    case 'category':
      return 'CreativeWork'
    case 'page':
      return 'WebPage'
    default:
      return 'WebPage'
  }
} 