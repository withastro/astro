'use client'

import Head from 'next/head'
import { useEffect, useState } from 'react'
import { 
  generateHreflangTags, 
  generateOpenGraphLocaleTags, 
  generateStructuredData,
  getCanonicalUrl
} from '@/app/utils/seo'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface ContentSeoProps {
  contentId: number
  contentType: ContentType
  title: string
  description?: string
  locale: string
  slug: string
  image?: string
  publishedAt?: string
  modifiedAt?: string
}

/**
 * Component for adding SEO metadata to content pages
 * Handles canonical URLs, hreflang tags, Open Graph tags, and structured data
 */
export default function ContentSeo({
  contentId,
  contentType,
  title,
  description,
  locale,
  slug,
  image,
  publishedAt,
  modifiedAt
}: ContentSeoProps) {
  const [localizedSlugs, setLocalizedSlugs] = useState<Record<string, string>>({
    [locale]: slug // Start with the current slug
  })
  
  // Fetch all localized slugs for this content
  useEffect(() => {
    async function fetchLocalizedSlugs() {
      try {
        const response = await fetch(`/api/${contentType}/${contentId}/slugs`)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data && data.slugs) {
            setLocalizedSlugs(data.slugs)
          }
        }
      } catch (error) {
        console.error('Error fetching localized slugs for SEO:', error)
      }
    }
    
    if (contentId) {
      fetchLocalizedSlugs()
    }
  }, [contentId, contentType])
  
  // Generate hreflang tags
  const hreflangTags = generateHreflangTags(contentId, contentType, localizedSlugs)
  
  // Generate Open Graph locale tags
  const ogLocaleTags = generateOpenGraphLocaleTags(contentId, contentType, localizedSlugs)
  
  // Generate structured data
  const structuredData = generateStructuredData(
    {
      id: contentId,
      contentType,
      slug,
      locale,
      title,
      description
    },
    localizedSlugs
  )
  
  // Get canonical URL for this page
  const canonicalUrl = getCanonicalUrl(locale, contentType, slug)
  
  return (
    <>
      {/* Basic meta tags */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* hreflang tags */}
      {hreflangTags.map(tag => (
        <link 
          key={tag.hreflang}
          rel="alternate" 
          hrefLang={tag.hreflang} 
          href={tag.url} 
        />
      ))}
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={contentType === 'blog' ? 'article' : 'website'} />
      <meta property="og:url" content={canonicalUrl} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:locale" content={locale.replace('-', '_')} />
      
      {/* Open Graph locale alternates */}
      {ogLocaleTags.map(tag => (
        <meta 
          key={tag.locale}
          property="og:locale:alternate" 
          content={tag.locale} 
        />
      ))}
      
      {/* Twitter card */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Article-specific metadata */}
      {contentType === 'blog' && publishedAt && (
        <>
          <meta property="article:published_time" content={publishedAt} />
          {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
        </>
      )}
      
      {/* Structured data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(structuredData)
        }}
      />
    </>
  )
} 