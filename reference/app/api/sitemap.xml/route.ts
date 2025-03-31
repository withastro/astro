import { NextResponse } from 'next/server'
import { generateSitemap, generateSitemapXml } from '@/app/utils/sitemap'

export const revalidate = 3600 // Revalidate every hour
export const dynamic = 'force-dynamic'

/**
 * Generates and serves the sitemap.xml file
 */
export async function GET() {
  try {
    // Generate sitemap entries
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
    const entries = await generateSitemap({ baseUrl: siteUrl })
    
    // Generate XML from entries
    const xml = generateSitemapXml(entries)
    
    // Return XML with proper content type
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
} 