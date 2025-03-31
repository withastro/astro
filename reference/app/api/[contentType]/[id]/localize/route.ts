import { NextRequest } from 'next/server'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/app/i18n/settings'
import { getLocalizedSlug } from '@/app/utils/content'

type ContentType = 'blog' | 'project' | 'category' | 'page'

/**
 * GET /api/[contentType]/[id]/localize?locale=xx
 * 
 * Retrieves a localized slug for a specific content item and locale
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { contentType: string; id: string } }
) {
  const contentType = params.contentType.toLowerCase() as ContentType
  const contentId = parseInt(params.id, 10)
  
  // Get locale from query parameters, defaulting to the site's default locale
  const searchParams = request.nextUrl.searchParams
  const locale = searchParams.get('locale') || DEFAULT_LOCALE
  
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
  if (!SUPPORTED_LOCALES.includes(locale)) {
    return Response.json(
      { error: `Unsupported locale. Must be one of: ${SUPPORTED_LOCALES.join(', ')}` },
      { status: 400 }
    )
  }
  
  try {
    // Retrieve the localized slug
    const slug = await getLocalizedSlug(contentId, contentType, locale)
    
    if (!slug) {
      return Response.json(
        { error: `No slug found for ${contentType} with ID ${contentId} in locale ${locale}` },
        { status: 404 }
      )
    }
    
    return Response.json({
      id: contentId,
      contentType,
      locale,
      slug
    })
  } catch (error) {
    console.error(`Error retrieving localized slug for ${contentType} with ID ${contentId}:`, error)
    return Response.json(
      { error: 'An error occurred while retrieving the localized slug' },
      { status: 500 }
    )
  }
} 