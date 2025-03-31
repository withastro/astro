import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/app/i18n/settings'
import { getContentBySlug } from '@/app/utils/content'

type ContentType = 'blog' | 'project' | 'category' | 'page'

// Generate static paths for all content types and locales
export async function generateStaticParams() {
  // This would typically fetch all content and their localized slugs
  // For now, we're using a placeholder
  return [] as { locale: string; contentType: string; slug: string }[]
}

// Page component for all content types
export default async function ContentPage({ 
  params 
}: { 
  params: { locale: string; contentType: string; slug: string } 
}) {
  const { locale, contentType, slug } = params
  
  // Validate locale
  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound()
  }
  
  // Validate content type
  const validContentType = contentType.toLowerCase() as ContentType
  if (!['blog', 'project', 'category', 'page'].includes(validContentType)) {
    notFound()
  }
  
  try {
    // Fetch content for this slug and locale
    const content = await getContentBySlug(validContentType, slug, locale)
    
    if (!content) {
      notFound()
    }
    
    // Determine which component to render based on content type
    // Here we're using a simple switch case but could be more sophisticated
    return (
      <div className="content-page">
        <h1>{content.title}</h1>
        
        {content.locale !== locale && (
          <div className="translation-notice">
            This content is shown in {content.locale} as it's not available in {locale}.
          </div>
        )}
        
        {/* Basic content rendering - would be more sophisticated in production */}
        {content.description && (
          <div className="description">{content.description}</div>
        )}
        
        {content.body && (
          <div className="body" dangerouslySetInnerHTML={{ __html: content.body }} />
        )}
        
        <div className="meta">
          <p>Content ID: {content.id}</p>
          <p>Content Type: {validContentType}</p>
          <p>Locale: {content.locale}</p>
          <p>Slug: {content.slug}</p>
        </div>
      </div>
    )
  } catch (error) {
    console.error(`Error fetching ${contentType}:`, error)
    notFound()
  }
} 