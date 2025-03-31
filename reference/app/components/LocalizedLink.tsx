'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { DEFAULT_LOCALE } from '@/app/i18n/settings'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface LocalizedLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  contentId?: number
  contentType?: ContentType
  slug?: string
  targetLocale?: string
  className?: string
  children: React.ReactNode
}

/**
 * A component that handles linking to content with localized slugs
 * Can be used in three ways:
 * 1. With direct href: <LocalizedLink href="/about">About</LocalizedLink>
 * 2. With contentId and contentType: <LocalizedLink contentId={5} contentType="blog">Blog Post</LocalizedLink>
 * 3. With contentType and slug: <LocalizedLink contentType="blog" slug="my-post">Blog Post</LocalizedLink>
 */
export default function LocalizedLink({
  href,
  contentId,
  contentType, 
  slug,
  targetLocale,
  className = '',
  children,
  ...rest
}: LocalizedLinkProps) {
  const params = usePathname()
  const currentLocale = params.locale as string || DEFAULT_LOCALE
  
  // State to store the resolved localized URL
  const [localizedHref, setLocalizedHref] = useState<string | null>(null)
  // State to track if we're loading the URL
  const [isLoading, setIsLoading] = useState(false)
  
  // If href is provided directly, just use it with the current locale
  const directHref = href ? `/${targetLocale || currentLocale}${href.startsWith('/') ? href : `/${href}`}` : null
  
  useEffect(() => {
    // If direct href is provided, no need to fetch the URL
    if (directHref) {
      setLocalizedHref(directHref)
      return
    }
    
    // If we need to fetch the URL (contentId+contentType or contentType+slug)
    async function fetchLocalizedUrl() {
      try {
        setIsLoading(true)
        
        let apiUrl: string
        
        // Case 1: contentId and contentType are provided
        if (contentId && contentType) {
          apiUrl = `/api/${contentType}/${contentId}/localize?locale=${targetLocale || currentLocale}`
        } 
        // Case 2: contentType and slug are provided
        else if (contentType && slug) {
          apiUrl = `/api/${contentType}/by-slug?slug=${slug}&locale=${targetLocale || currentLocale}`
        } else {
          console.error('LocalizedLink: Either href, or contentId+contentType, or contentType+slug must be provided')
          return
        }
        
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch localized URL: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Construct the localized URL from the API response
        if (data) {
          const locale = targetLocale || currentLocale
          
          if (contentId && contentType) {
            // Format: /{locale}/{contentType}/{slug}
            setLocalizedHref(`/${locale}/${contentType}/${data.slug}`)
          } else {
            // We already have the content, format: /{locale}/{contentType}/{slug}
            setLocalizedHref(`/${locale}/${contentType}/${data.slug}`)
          }
        } else {
          console.error('LocalizedLink: Failed to get localized slug from API')
        }
      } catch (error) {
        console.error('Error fetching localized URL:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if ((contentId && contentType) || (contentType && slug)) {
      fetchLocalizedUrl()
    }
  }, [contentId, contentType, slug, currentLocale, targetLocale, directHref])
  
  // If we're still loading the URL or no URL could be resolved, render a span instead
  if (isLoading || (!localizedHref && !directHref)) {
    return (
      <span className={`${className} localized-link-loading`} {...rest}>
        {children}
      </span>
    )
  }
  
  // Render the Link with the resolved URL
  return (
    <Link 
      href={localizedHref || directHref || '#'} 
      className={`${className} localized-link`} 
      {...rest}
    >
      {children}
    </Link>
  )
} 