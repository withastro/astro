import { NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/app/i18n/config'
import type { Locale } from '@/app/i18n/config'
import { getContentBySlug } from '@/app/utils/content'
import { validateSlug } from '@/app/utils/slug'

type ContentType = 'blog' | 'project' | 'category' | 'page'

/**
 * GET /api/[contentType]/by-slug?slug=[slug]&locale=[locale]
 * 
 * Retrieves content by slug and locale with proper fallback handling
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { contentType: string } }
) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const locale = searchParams.get('locale') as Locale || defaultLocale
  const contentType = params.contentType.toLowerCase() as ContentType
  
  // Validate parameters
  if (!slug) {
    return Response.json(
      { error: 'Slug parameter is required' },
      { status: 400 }
    )
  }
  
  // Validate slug format
  const slugValidation = validateSlug(slug)
  if (!slugValidation.isValid) {
    return Response.json(
      { error: 'Invalid slug format', reason: slugValidation.reason },
      { status: 400 }
    )
  }
  
  // Validate content type
  if (!['blog', 'project', 'category', 'page'].includes(contentType)) {
    return Response.json(
      { error: 'Invalid content type. Must be one of: blog, project, category, page' },
      { status: 400 }
    )
  }
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return Response.json(
      { error: `Invalid locale. Must be one of: ${locales.join(', ')}` },
      { status: 400 }
    )
  }
  
  try {
    // Retrieve content with the provided slug and locale
    const content = await getContentBySlug(contentType, slug, locale)
    
    if (!content) {
      return Response.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }
    
    return Response.json({
      content,
      meta: {
        contentType,
        slug,
        locale,
        fallback: content._fallback || false
      }
    })
  } catch (error) {
    console.error(`Error retrieving ${contentType} with slug "${slug}":`, error)
    return Response.json(
      { error: 'An error occurred while retrieving content' },
      { status: 500 }
    )
  }
} 