import { NextResponse } from 'next/server'

export const revalidate = 86400 // Revalidate once per day

/**
 * Generates and serves the robots.txt file
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  
  // Create robots.txt content with sitemap reference
  const robotsContent = `
# Allow all crawlers
User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/api/sitemap.xml

# Disallow admin paths
User-agent: *
Disallow: /admin/
Disallow: /api/admin/
`.trim()

  // Return text with proper content type
  return new NextResponse(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  })
} 