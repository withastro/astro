import { and, eq } from 'drizzle-orm'
import { db } from '@/app/db'
import {
  blogs,
  blogTranslations,
  contentCategories,
  contentCategoryTranslations,
  pages,
  pageTranslations,
  projects,
  projectTranslations
} from '@/app/db/schema'
import { type Locale } from '@/app/i18n/config'
import { env } from '@/env.mjs'

const DEFAULT_LOCALE = env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale || 'de'

type ContentType = 'blog' | 'project' | 'category' | 'page'

/**
 * Retrieves content by slug and locale with fallback to default locale
 * 
 * @param contentType The type of content to retrieve
 * @param slug The slug to look up
 * @param locale The locale to retrieve content for
 * @returns The content data with translation or null if not found
 */
export async function getContentBySlug(
  contentType: ContentType,
  slug: string,
  locale: Locale
) {
  let content = null
  
  // Try to find content with requested locale and slug
  switch (contentType) {
    case 'blog': {
      const result = await db.select()
        .from(blogTranslations)
        .innerJoin(blogs, eq(blogTranslations.blog_id, blogs.id))
        .where(
          and(
            eq(blogTranslations.slug, slug),
            eq(blogTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        content = result[0]
      }
      break
    }
    
    case 'project': {
      const result = await db.select()
        .from(projectTranslations)
        .innerJoin(projects, eq(projectTranslations.project_id, projects.id))
        .where(
          and(
            eq(projectTranslations.slug, slug),
            eq(projectTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        content = result[0]
      }
      break
    }
    
    case 'category': {
      const result = await db.select()
        .from(contentCategoryTranslations)
        .innerJoin(contentCategories, eq(contentCategoryTranslations.category_id, contentCategories.id))
        .where(
          and(
            eq(contentCategoryTranslations.slug, slug),
            eq(contentCategoryTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        content = result[0]
      }
      break
    }
    
    case 'page': {
      const result = await db.select()
        .from(pageTranslations)
        .innerJoin(pages, eq(pageTranslations.page_id, pages.id))
        .where(
          and(
            eq(pageTranslations.slug, slug),
            eq(pageTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        content = result[0]
      }
      break
    }
  }
  
  // If not found and locale is not the default, try to find content with the default locale
  if (!content && locale !== DEFAULT_LOCALE) {
    return await getContentWithFallback(contentType, slug, locale)
  }
  
  return content
}

/**
 * Tries to find content by slug in the default locale, then retrieves the translation for the requested locale
 * 
 * @param contentType The type of content to retrieve
 * @param slug The slug to look up (in default locale)
 * @param targetLocale The target locale for the content
 * @returns The content with translations for the target locale or null if not found
 */
async function getContentWithFallback(
  contentType: ContentType,
  slug: string,
  targetLocale: Locale
) {
  let contentId: number | null = null
  let defaultContent = null
  
  // First, try to find the content in the default locale by the same slug
  switch (contentType) {
    case 'blog': {
      const result = await db.select()
        .from(blogTranslations)
        .where(
          and(
            eq(blogTranslations.slug, slug),
            eq(blogTranslations.locale, DEFAULT_LOCALE)
          )
        )
        .execute()
      
      if (result.length > 0) {
        contentId = Number(result[0].blog_id)
        defaultContent = result[0]
      }
      break
    }
    
    case 'project': {
      const result = await db.select()
        .from(projectTranslations)
        .where(
          and(
            eq(projectTranslations.slug, slug),
            eq(projectTranslations.locale, DEFAULT_LOCALE)
          )
        )
        .execute()
      
      if (result.length > 0) {
        contentId = Number(result[0].project_id)
        defaultContent = result[0]
      }
      break
    }
    
    case 'category': {
      const result = await db.select()
        .from(contentCategoryTranslations)
        .where(
          and(
            eq(contentCategoryTranslations.slug, slug),
            eq(contentCategoryTranslations.locale, DEFAULT_LOCALE)
          )
        )
        .execute()
      
      if (result.length > 0) {
        contentId = Number(result[0].category_id)
        defaultContent = result[0]
      }
      break
    }
    
    case 'page': {
      const result = await db.select()
        .from(pageTranslations)
        .where(
          and(
            eq(pageTranslations.slug, slug),
            eq(pageTranslations.locale, DEFAULT_LOCALE)
          )
        )
        .execute()
      
      if (result.length > 0) {
        contentId = Number(result[0].page_id)
        defaultContent = result[0]
      }
      break
    }
  }
  
  // If content exists in default locale, try to get the translation for target locale
  if (contentId) {
    let targetContent = null
    
    switch (contentType) {
      case 'blog': {
        const result = await db.select()
          .from(blogTranslations)
          .where(
            and(
              eq(blogTranslations.blog_id, contentId),
              eq(blogTranslations.locale, targetLocale)
            )
          )
          .execute()
        
        if (result.length > 0) {
          targetContent = result[0]
        }
        break
      }
      
      case 'project': {
        const result = await db.select()
          .from(projectTranslations)
          .where(
            and(
              eq(projectTranslations.project_id, contentId),
              eq(projectTranslations.locale, targetLocale)
            )
          )
          .execute()
        
        if (result.length > 0) {
          targetContent = result[0]
        }
        break
      }
      
      case 'category': {
        const result = await db.select()
          .from(contentCategoryTranslations)
          .where(
            and(
              eq(contentCategoryTranslations.category_id, contentId),
              eq(contentCategoryTranslations.locale, targetLocale)
            )
          )
          .execute()
        
        if (result.length > 0) {
          targetContent = result[0]
        }
        break
      }
      
      case 'page': {
        const result = await db.select()
          .from(pageTranslations)
          .where(
            and(
              eq(pageTranslations.page_id, contentId),
              eq(pageTranslations.locale, targetLocale)
            )
          )
          .execute()
        
        if (result.length > 0) {
          targetContent = result[0]
        }
        break
      }
    }
    
    // If we found a translation in the target locale, return it
    if (targetContent) {
      return {
        ...targetContent,
        _fallback: false
      }
    }
    
    // Otherwise return the default locale content with a fallback flag
    if (defaultContent) {
      return {
        ...defaultContent,
        _fallback: true
      }
    }
  }
  
  return null
}

/**
 * Retrieves a localized slug for a specific content item
 * 
 * @param contentId The ID of the content
 * @param contentType The type of content
 * @param locale The locale to get the slug for
 * @returns The localized slug or null if not found
 */
export async function getLocalizedSlug(
  contentId: number,
  contentType: ContentType,
  locale: Locale
): Promise<string | null> {
  let slug = null
  
  switch (contentType) {
    case 'blog': {
      const result = await db.select({ slug: blogTranslations.slug })
        .from(blogTranslations)
        .where(
          and(
            eq(blogTranslations.blog_id, contentId),
            eq(blogTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        slug = result[0].slug
      }
      break
    }
    
    case 'project': {
      const result = await db.select({ slug: projectTranslations.slug })
        .from(projectTranslations)
        .where(
          and(
            eq(projectTranslations.project_id, contentId),
            eq(projectTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        slug = result[0].slug
      }
      break
    }
    
    case 'category': {
      const result = await db.select({ slug: contentCategoryTranslations.slug })
        .from(contentCategoryTranslations)
        .where(
          and(
            eq(contentCategoryTranslations.category_id, contentId),
            eq(contentCategoryTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        slug = result[0].slug
      }
      break
    }
    
    case 'page': {
      const result = await db.select({ slug: pageTranslations.slug })
        .from(pageTranslations)
        .where(
          and(
            eq(pageTranslations.page_id, contentId),
            eq(pageTranslations.locale, locale)
          )
        )
        .execute()
      
      if (result.length > 0) {
        slug = result[0].slug
      }
      break
    }
  }
  
  // If not found in requested locale, try to get the default locale slug
  if (!slug && locale !== DEFAULT_LOCALE) {
    return await getLocalizedSlug(contentId, contentType, DEFAULT_LOCALE)
  }
  
  return slug
}

/**
 * Gets all localized slugs for a content item
 * 
 * @param contentId The ID of the content
 * @param contentType The type of content
 * @returns An object mapping locales to their respective slugs
 */
export async function getAllLocalizedSlugs(
  contentId: number,
  contentType: ContentType
): Promise<Record<Locale, string>> {
  const slugMap: Partial<Record<Locale, string>> = {}
  
  switch (contentType) {
    case 'blog': {
      const results = await db.select({ locale: blogTranslations.locale, slug: blogTranslations.slug })
        .from(blogTranslations)
        .where(eq(blogTranslations.blog_id, contentId))
        .execute()
      
      for (const result of results) {
        slugMap[result.locale as Locale] = result.slug
      }
      break
    }
    
    case 'project': {
      const results = await db.select({ locale: projectTranslations.locale, slug: projectTranslations.slug })
        .from(projectTranslations)
        .where(eq(projectTranslations.project_id, contentId))
        .execute()
      
      for (const result of results) {
        slugMap[result.locale as Locale] = result.slug
      }
      break
    }
    
    case 'category': {
      const results = await db.select({ locale: contentCategoryTranslations.locale, slug: contentCategoryTranslations.slug })
        .from(contentCategoryTranslations)
        .where(eq(contentCategoryTranslations.category_id, contentId))
        .execute()
      
      for (const result of results) {
        slugMap[result.locale as Locale] = result.slug
      }
      break
    }
    
    case 'page': {
      const results = await db.select({ locale: pageTranslations.locale, slug: pageTranslations.slug })
        .from(pageTranslations)
        .where(eq(pageTranslations.page_id, contentId))
        .execute()
      
      for (const result of results) {
        slugMap[result.locale as Locale] = result.slug
      }
      break
    }
  }
  
  return slugMap as Record<Locale, string>
} 