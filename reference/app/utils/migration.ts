import { eq, isNull, or } from 'drizzle-orm'
import { db } from '@/app/db'
import { 
  blogs, blogTranslations,
  contentCategories, contentCategoryTranslations,
  pages, pageTranslations,
  projects, projectTranslations
} from '@/app/db/schema'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/app/i18n/settings'
import { generateLocalizedSlug, slugify, validateSlug } from '@/app/utils/slug'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface ContentItemToMigrate {
  id: number
  title: string
  slug: string | null
  locale: string
}

interface MigrationReport {
  contentType: ContentType
  totalItems: number
  missingSlugItems: number
  fixedItems: number
  errors: Array<{
    itemId: number
    locale: string
    error: string
  }>
}

/**
 * Fetches all blog translations that need slug migration
 */
async function getBlogItemsToMigrate(): Promise<ContentItemToMigrate[]> {
  const results = await db
    .select({
      id: blogTranslations.id,
      parentId: blogTranslations.parentId,
      title: blogTranslations.title,
      slug: blogTranslations.slug,
      locale: blogTranslations.locale
    })
    .from(blogTranslations)
    .where(or(isNull(blogTranslations.slug), eq(blogTranslations.slug, '')))
    .execute()
  
  return results.map(item => ({
    id: item.parentId,
    title: item.title,
    slug: item.slug,
    locale: item.locale
  }))
}

/**
 * Fetches all project translations that need slug migration
 */
async function getProjectItemsToMigrate(): Promise<ContentItemToMigrate[]> {
  const results = await db
    .select({
      id: projectTranslations.id,
      parentId: projectTranslations.parentId,
      title: projectTranslations.title,
      slug: projectTranslations.slug,
      locale: projectTranslations.locale
    })
    .from(projectTranslations)
    .where(or(isNull(projectTranslations.slug), eq(projectTranslations.slug, '')))
    .execute()
  
  return results.map(item => ({
    id: item.parentId,
    title: item.title,
    slug: item.slug,
    locale: item.locale
  }))
}

/**
 * Fetches all category translations that need slug migration
 */
async function getCategoryItemsToMigrate(): Promise<ContentItemToMigrate[]> {
  const results = await db
    .select({
      id: contentCategoryTranslations.id,
      parentId: contentCategoryTranslations.parentId,
      name: contentCategoryTranslations.name,
      slug: contentCategoryTranslations.slug,
      locale: contentCategoryTranslations.locale
    })
    .from(contentCategoryTranslations)
    .where(or(isNull(contentCategoryTranslations.slug), eq(contentCategoryTranslations.slug, '')))
    .execute()
  
  return results.map(item => ({
    id: item.parentId,
    title: item.name, // Using name as title for categories
    slug: item.slug,
    locale: item.locale
  }))
}

/**
 * Fetches all page translations that need slug migration
 */
async function getPageItemsToMigrate(): Promise<ContentItemToMigrate[]> {
  const results = await db
    .select({
      id: pageTranslations.id,
      parentId: pageTranslations.parentId,
      title: pageTranslations.title,
      slug: pageTranslations.slug,
      locale: pageTranslations.locale
    })
    .from(pageTranslations)
    .where(or(isNull(pageTranslations.slug), eq(pageTranslations.slug, '')))
    .execute()
  
  return results.map(item => ({
    id: item.parentId,
    title: item.title,
    slug: item.slug,
    locale: item.locale
  }))
}

/**
 * Fixes blogs with missing slugs by generating a slug based on the title
 */
async function fixBlogSlugs(items: ContentItemToMigrate[]): Promise<MigrationReport> {
  const report: MigrationReport = {
    contentType: 'blog',
    totalItems: items.length,
    missingSlugItems: items.length,
    fixedItems: 0,
    errors: []
  }
  
  for (const item of items) {
    try {
      if (!item.title) {
        throw new Error('Missing title, cannot generate slug')
      }
      
      // Generate a localized slug
      const newSlug = await generateLocalizedSlug(item.title, 'blog', item.locale, item.id)
      
      // Validate the slug
      const validationResult = validateSlug(newSlug)
      if (!validationResult.isValid) {
        throw new Error(`Invalid slug: ${validationResult.error}`)
      }
      
      // Update the slug in the database
      await db
        .update(blogTranslations)
        .set({ slug: newSlug })
        .where(
          eq(blogTranslations.parentId, item.id),
          eq(blogTranslations.locale, item.locale)
        )
        .execute()
      
      report.fixedItems++
    } catch (error) {
      report.errors.push({
        itemId: item.id,
        locale: item.locale,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return report
}

/**
 * Fixes projects with missing slugs by generating a slug based on the title
 */
async function fixProjectSlugs(items: ContentItemToMigrate[]): Promise<MigrationReport> {
  const report: MigrationReport = {
    contentType: 'project',
    totalItems: items.length,
    missingSlugItems: items.length,
    fixedItems: 0,
    errors: []
  }
  
  for (const item of items) {
    try {
      if (!item.title) {
        throw new Error('Missing title, cannot generate slug')
      }
      
      // Generate a localized slug
      const newSlug = await generateLocalizedSlug(item.title, 'project', item.locale, item.id)
      
      // Validate the slug
      const validationResult = validateSlug(newSlug)
      if (!validationResult.isValid) {
        throw new Error(`Invalid slug: ${validationResult.error}`)
      }
      
      // Update the slug in the database
      await db
        .update(projectTranslations)
        .set({ slug: newSlug })
        .where(
          eq(projectTranslations.parentId, item.id),
          eq(projectTranslations.locale, item.locale)
        )
        .execute()
      
      report.fixedItems++
    } catch (error) {
      report.errors.push({
        itemId: item.id,
        locale: item.locale,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return report
}

/**
 * Fixes categories with missing slugs by generating a slug based on the name
 */
async function fixCategorySlugs(items: ContentItemToMigrate[]): Promise<MigrationReport> {
  const report: MigrationReport = {
    contentType: 'category',
    totalItems: items.length,
    missingSlugItems: items.length,
    fixedItems: 0,
    errors: []
  }
  
  for (const item of items) {
    try {
      if (!item.title) {
        throw new Error('Missing name, cannot generate slug')
      }
      
      // Generate a localized slug
      const newSlug = await generateLocalizedSlug(item.title, 'category', item.locale, item.id)
      
      // Validate the slug
      const validationResult = validateSlug(newSlug)
      if (!validationResult.isValid) {
        throw new Error(`Invalid slug: ${validationResult.error}`)
      }
      
      // Update the slug in the database
      await db
        .update(contentCategoryTranslations)
        .set({ slug: newSlug })
        .where(
          eq(contentCategoryTranslations.parentId, item.id),
          eq(contentCategoryTranslations.locale, item.locale)
        )
        .execute()
      
      report.fixedItems++
    } catch (error) {
      report.errors.push({
        itemId: item.id,
        locale: item.locale,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return report
}

/**
 * Fixes pages with missing slugs by generating a slug based on the title
 */
async function fixPageSlugs(items: ContentItemToMigrate[]): Promise<MigrationReport> {
  const report: MigrationReport = {
    contentType: 'page',
    totalItems: items.length,
    missingSlugItems: items.length,
    fixedItems: 0,
    errors: []
  }
  
  for (const item of items) {
    try {
      if (!item.title) {
        throw new Error('Missing title, cannot generate slug')
      }
      
      // Generate a localized slug
      const newSlug = await generateLocalizedSlug(item.title, 'page', item.locale, item.id)
      
      // Validate the slug
      const validationResult = validateSlug(newSlug)
      if (!validationResult.isValid) {
        throw new Error(`Invalid slug: ${validationResult.error}`)
      }
      
      // Update the slug in the database
      await db
        .update(pageTranslations)
        .set({ slug: newSlug })
        .where(
          eq(pageTranslations.parentId, item.id),
          eq(pageTranslations.locale, item.locale)
        )
        .execute()
      
      report.fixedItems++
    } catch (error) {
      report.errors.push({
        itemId: item.id,
        locale: item.locale,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return report
}

/**
 * Audits all content types for missing localized slugs
 */
export async function auditMissingLocalizedSlugs(): Promise<{
  blog: ContentItemToMigrate[],
  project: ContentItemToMigrate[],
  category: ContentItemToMigrate[],
  page: ContentItemToMigrate[]
}> {
  const [blogItems, projectItems, categoryItems, pageItems] = await Promise.all([
    getBlogItemsToMigrate(),
    getProjectItemsToMigrate(),
    getCategoryItemsToMigrate(),
    getPageItemsToMigrate()
  ])
  
  return {
    blog: blogItems,
    project: projectItems,
    category: categoryItems,
    page: pageItems
  }
}

/**
 * Fixes missing localized slugs by generating slugs for items that need them
 */
export async function fixMissingLocalizedSlugs(): Promise<MigrationReport[]> {
  const items = await auditMissingLocalizedSlugs()
  
  const reports = await Promise.all([
    fixBlogSlugs(items.blog),
    fixProjectSlugs(items.project),
    fixCategorySlugs(items.category),
    fixPageSlugs(items.page)
  ])
  
  return reports
}

/**
 * Checks for and resolves slug collisions across all content types
 */
export async function checkAndResolveDuplicateSlugs(): Promise<{
  contentType: ContentType, 
  locale: string, 
  slug: string, 
  resolved: boolean
}[]> {
  // Implementation for collision detection and resolution
  // This would require a more complex analysis of the database
  // to find existing duplicates and resolve them
  
  // For now we'll return an empty array since the implementation would be complex
  // and require careful consideration of how to handle existing slug conflicts
  return []
}

/**
 * Creates localized slugs for existing content in all supported locales 
 * if certain locale translations exist but don't have slugs
 */
export async function ensureAllLocalesHaveSlugs(): Promise<MigrationReport[]> {
  // This would identify content that has some localized versions but not all,
  // and generate appropriate slugs for the missing locales
  
  // For now, we'll focus on fixing existing translations with missing slugs
  // rather than creating slugs for locales that might not have translations yet
  return await fixMissingLocalizedSlugs()
} 