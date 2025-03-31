import { and, eq } from 'drizzle-orm'
import { db } from '@/app/db'
import {
  blogTranslations,
  contentCategoryTranslations,
  pageTranslations,
  projectTranslations
} from '@/app/db/schema'
import { type Locale } from '@/app/i18n/config'

type ContentType = 'blog' | 'project' | 'category' | 'page'

const TRANSLITERATION_MAP: Record<string, string> = {
  // German
  'ä': 'ae',
  'ö': 'oe',
  'ü': 'ue',
  'ß': 'ss',
  // French
  'é': 'e',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'à': 'a',
  'â': 'a',
  'ç': 'c',
  'î': 'i',
  'ï': 'i',
  'ô': 'o',
  'ù': 'u',
  'û': 'u',
  'ÿ': 'y',
  // Spanish
  'á': 'a',
  'í': 'i',
  'ó': 'o',
  'ú': 'u',
  'ñ': 'n',
  '¿': '',
  '¡': '',
  // Italian
  'ì': 'i',
  'ò': 'o',
  // Polish
  'ą': 'a',
  'ć': 'c',
  'ę': 'e',
  'ł': 'l',
  'ń': 'n',
  'ó': 'o',
  'ś': 's',
  'ź': 'z',
  'ż': 'z',
  // Czech
  'č': 'c',
  'ď': 'd',
  'ě': 'e',
  'ň': 'n',
  'ř': 'r',
  'š': 's',
  'ť': 't',
  'ů': 'u',
  'ž': 'z',
  // Swedish, Danish, Norwegian
  'å': 'a',
  'æ': 'ae',
  'ø': 'o',
}

// Keep umlauts for German locales
const KEEP_UMLAUTS_LOCALES = ['de', 'at', 'ch']

/**
 * Generates a localized slug from a string based on locale-specific rules
 * 
 * @param text The text to convert to a slug
 * @param locale The locale to use for slug generation
 * @returns A properly formatted slug
 */
export function slugify(text: string, locale: Locale): string {
  // Convert to lowercase
  let slug = text.toLowerCase()
  
  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, '-')
  
  // Locale-specific handling
  if (KEEP_UMLAUTS_LOCALES.includes(locale)) {
    // For German, keep umlauts but replace other special characters
    Object.entries(TRANSLITERATION_MAP).forEach(([char, replacement]) => {
      // Keep German umlauts for German locales
      if (locale === 'de' && ['ä', 'ö', 'ü', 'ß'].includes(char)) {
        return
      }
      // Replace other special characters
      slug = slug.replace(new RegExp(char, 'g'), replacement)
    })
  } else {
    // For non-German locales, replace all special characters
    Object.entries(TRANSLITERATION_MAP).forEach(([char, replacement]) => {
      slug = slug.replace(new RegExp(char, 'g'), replacement)
    })
  }
  
  // Remove remaining special characters and replace with hyphens
  slug = slug.replace(/[^a-z0-9äöüß-]/g, '-')
  
  // Remove duplicate hyphens
  slug = slug.replace(/-+/g, '-')
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '')
  
  return slug
}

/**
 * Checks if a slug already exists for a specific content type and locale
 * 
 * @param slug The slug to check
 * @param contentType The type of content (blog, project, category, page)
 * @param locale The locale to check against
 * @param contentId Optional content ID to exclude from the check (for updates)
 * @returns True if the slug exists, false otherwise
 */
export async function checkSlugExists(
  slug: string,
  contentType: ContentType,
  locale: Locale,
  contentId?: number
): Promise<boolean> {
  let exists = false
  
  switch (contentType) {
    case 'blog':
      if (contentId) {
        const result = await db.select().from(blogTranslations).where(
          and(
            eq(blogTranslations.slug, slug),
            eq(blogTranslations.locale, locale),
            eq(blogTranslations.blog_id, contentId)
          )
        ).execute()
        exists = result.length > 0
      } else {
        const result = await db.select().from(blogTranslations).where(
          and(
            eq(blogTranslations.slug, slug),
            eq(blogTranslations.locale, locale)
          )
        ).execute()
        exists = result.length > 0
      }
      break
      
    case 'project':
      if (contentId) {
        const result = await db.select().from(projectTranslations).where(
          and(
            eq(projectTranslations.slug, slug),
            eq(projectTranslations.locale, locale),
            eq(projectTranslations.project_id, contentId)
          )
        ).execute()
        exists = result.length > 0
      } else {
        const result = await db.select().from(projectTranslations).where(
          and(
            eq(projectTranslations.slug, slug),
            eq(projectTranslations.locale, locale)
          )
        ).execute()
        exists = result.length > 0
      }
      break
      
    case 'category':
      if (contentId) {
        const result = await db.select().from(contentCategoryTranslations).where(
          and(
            eq(contentCategoryTranslations.slug, slug),
            eq(contentCategoryTranslations.locale, locale),
            eq(contentCategoryTranslations.category_id, contentId)
          )
        ).execute()
        exists = result.length > 0
      } else {
        const result = await db.select().from(contentCategoryTranslations).where(
          and(
            eq(contentCategoryTranslations.slug, slug),
            eq(contentCategoryTranslations.locale, locale)
          )
        ).execute()
        exists = result.length > 0
      }
      break
      
    case 'page':
      if (contentId) {
        const result = await db.select().from(pageTranslations).where(
          and(
            eq(pageTranslations.slug, slug),
            eq(pageTranslations.locale, locale),
            eq(pageTranslations.page_id, contentId)
          )
        ).execute()
        exists = result.length > 0
      } else {
        const result = await db.select().from(pageTranslations).where(
          and(
            eq(pageTranslations.slug, slug),
            eq(pageTranslations.locale, locale)
          )
        ).execute()
        exists = result.length > 0
      }
      break
  }
  
  return exists
}

/**
 * Generates a unique localized slug for a given content type
 * 
 * @param baseTitle The title to convert to a slug
 * @param contentType The type of content (blog, project, category, page)
 * @param locale The locale to use for slug generation
 * @param contentId Optional content ID to exclude from uniqueness check (for updates)
 * @returns A unique slug for the given content
 */
export async function generateLocalizedSlug(
  baseTitle: string,
  contentType: ContentType,
  locale: Locale,
  contentId?: number
): Promise<string> {
  // Basic slugification with locale-specific rules
  let slug = slugify(baseTitle, locale)
  
  // Check for existing slug with same name in this locale
  const exists = await checkSlugExists(slug, contentType, locale, contentId)
  
  // If collision detected, append a unique identifier
  if (exists) {
    // Try adding a numeric suffix
    let counter = 1
    let newSlug = `${slug}-${counter}`
    
    // Keep incrementing the counter until we find a unique slug
    while (await checkSlugExists(newSlug, contentType, locale, contentId)) {
      counter++
      newSlug = `${slug}-${counter}`
    }
    
    slug = newSlug
  }
  
  return slug
}

/**
 * Validates a slug across locales to ensure it meets standards
 * 
 * @param slug The slug to validate
 * @returns An object with validation results and reason if invalid
 */
export function validateSlug(slug: string): { isValid: boolean; reason?: string } {
  // Check if slug is empty
  if (!slug || slug.trim() === '') {
    return { isValid: false, reason: 'Slug cannot be empty' }
  }
  
  // Check for valid slug format (only lowercase letters, numbers, and hyphens)
  if (!/^[a-z0-9äöüß-]+$/.test(slug)) {
    return {
      isValid: false,
      reason: 'Slug can only contain lowercase letters, numbers, German umlauts, and hyphens'
    }
  }
  
  // Check if slug starts or ends with a hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return {
      isValid: false,
      reason: 'Slug cannot start or end with a hyphen'
    }
  }
  
  // Check for consecutive hyphens
  if (slug.includes('--')) {
    return {
      isValid: false,
      reason: 'Slug cannot contain consecutive hyphens'
    }
  }
  
  // Check length (not too short, not too long)
  if (slug.length < 3) {
    return {
      isValid: false,
      reason: 'Slug must be at least 3 characters long'
    }
  }
  
  if (slug.length > 100) {
    return {
      isValid: false,
      reason: 'Slug cannot be longer than 100 characters'
    }
  }
  
  // All checks passed
  return { isValid: true }
} 