import { and, eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { db } from '@/app/db'
import {
  blogTranslations,
  contentCategoryTranslations,
  pageTranslations,
  projectTranslations
} from '@/app/db/schema'
import { SUPPORTED_LOCALES } from '@/app/i18n/settings'
import { checkSlugExists, generateLocalizedSlug, validateSlug } from '@/app/utils/slug'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface UpdateSlugRequest {
  slug?: string  // If provided, use this slug; if not, auto-generate from title
  title?: string // Required if slug is not provided - used to generate a slug
  locale: string
}

/**
 * POST /api/[contentType]/[id]/slug
 * 
 * Updates or creates a localized slug for a specific content item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { contentType: string; id: string } }
) {
  try {
    const contentType = params.contentType.toLowerCase() as ContentType
    const contentId = parseInt(params.id, 10)
    const body: UpdateSlugRequest = await request.json()
    
    // Validate content type
    if (!['blog', 'project', 'category', 'page'].includes(contentType)) {
      return Response.json(
        { error: 'Invalid content type. Must be one of: blog, project, category, page' },
        { status: 400 }
      )
    }
    
    // Validate ID
    if (isNaN(contentId) || contentId <= 0) {
      return Response.json(
        { error: 'Invalid ID. Must be a positive integer' },
        { status: 400 }
      )
    }
    
    // Validate locale
    if (!body.locale || !SUPPORTED_LOCALES.includes(body.locale)) {
      return Response.json(
        { error: `Unsupported locale. Must be one of: ${SUPPORTED_LOCALES.join(', ')}` },
        { status: 400 }
      )
    }
    
    // If slug is provided, validate it
    let slug = body.slug
    if (slug) {
      const validationResult = validateSlug(slug)
      if (!validationResult.valid) {
        return Response.json(
          { error: `Invalid slug: ${validationResult.message}` },
          { status: 400 }
        )
      }
      
      // Check if slug exists for another content item
      const exists = await checkSlugExists(slug, contentType, body.locale, contentId)
      if (exists) {
        return Response.json(
          { error: `Slug '${slug}' already exists for another ${contentType} in locale '${body.locale}'` },
          { status: 409 }
        )
      }
    } 
    // If no slug provided, generate one from title
    else if (body.title) {
      slug = await generateLocalizedSlug(body.title, contentType, body.locale, contentId)
    } else {
      return Response.json(
        { error: 'Either slug or title must be provided' },
        { status: 400 }
      )
    }
    
    // Get the appropriate translations table based on content type
    let translationsTable
    switch (contentType) {
      case 'blog':
        translationsTable = blogTranslations
        break
      case 'project':
        translationsTable = projectTranslations
        break
      case 'category':
        translationsTable = contentCategoryTranslations
        break
      case 'page':
        translationsTable = pageTranslations
        break
    }
    
    // Check if translation exists and update or create accordingly
    const existingTranslation = await db.select({ count: db.fn.count() })
      .from(translationsTable)
      .where(and(
        eq(translationsTable.parentId, contentId),
        eq(translationsTable.locale, body.locale)
      ))
      .execute()
    
    const translationExists = existingTranslation[0]?.count > 0
    
    if (translationExists) {
      // Update existing translation
      await db.update(translationsTable)
        .set({ slug })
        .where(and(
          eq(translationsTable.parentId, contentId),
          eq(translationsTable.locale, body.locale)
        ))
        .execute()
    } else {
      // Create new translation with minimal data (just slug and locale)
      await db.insert(translationsTable)
        .values({
          parentId: contentId,
          locale: body.locale,
          slug,
          title: body.title || slug, // Use title if provided, otherwise use slug as title
        })
        .execute()
    }
    
    return Response.json({
      id: contentId,
      contentType,
      locale: body.locale,
      slug,
      message: `${translationExists ? 'Updated' : 'Created'} slug for ${contentType} with ID ${contentId} in locale ${body.locale}`
    })
  } catch (error) {
    console.error('Error updating slug:', error)
    return Response.json(
      { error: 'An error occurred while updating the slug' },
      { status: 500 }
    )
  }
} 