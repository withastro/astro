import { NextRequest } from 'next/server'
import { getAllLocalizedSlugs } from '@/app/utils/content'

type ContentType = 'blog' | 'project' | 'category' | 'page'

/**
 * GET /api/[contentType]/[id]/slugs
 * 
 * Retrieves all localized slugs for a specific content item
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { contentType: string; id: string } }
) {
  const contentType = params.contentType.toLowerCase() as ContentType
  const contentId = parseInt(params.id, 10)
  
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
  
  try {
    // Retrieve all localized slugs for the content
    const slugs = await getAllLocalizedSlugs(contentId, contentType)
    
    return Response.json({
      id: contentId,
      contentType,
      slugs
    })
  } catch (error) {
    console.error(`Error retrieving slugs for ${contentType} with ID ${contentId}:`, error)
    return Response.json(
      { error: 'An error occurred while retrieving slugs' },
      { status: 500 }
    )
  }
} 