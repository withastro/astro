'use client'

import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LOCALE_METADATA, SUPPORTED_LOCALES } from '@/app/i18n/settings'
import LocalizedLink from './LocalizedLink'

interface LanguageSelectorProps {
  contentId?: number
  contentType?: string
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
  variant?: 'dropdown' | 'horizontal'
}

/**
 * A component that renders a language selector
 * Shows all available languages and highlights the current one
 * When used on a content page, it will automatically link to the localized version
 */
export default function LanguageSelector({
  contentId,
  contentType,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  variant = 'dropdown'
}: LanguageSelectorProps) {
  const params = useParams()
  const pathname = usePathname()
  const currentLocale = params.locale as string
  
  const [isOpen, setIsOpen] = useState(false)
  const [localizedSlugs, setLocalizedSlugs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Extract content type and slug from pathname if not explicitly provided
  let extractedContentType: string | null = null
  let extractedSlug: string | null = null
  
  if (!contentId && !contentType) {
    // Attempt to extract from URL path
    // Format: /{locale}/{contentType}/{slug}
    const pathParts = pathname.split('/').filter(Boolean)
    
    if (pathParts.length >= 3) {
      extractedContentType = pathParts[1]
      extractedSlug = pathParts[2]
    }
  }
  
  // Use provided or extracted values
  const effectiveContentType = contentType || extractedContentType
  const effectiveSlug = extractedSlug
  
  useEffect(() => {
    // If we have a content ID and content type, fetch all localized slugs
    if ((contentId && effectiveContentType) || (effectiveContentType && effectiveSlug)) {
      async function fetchLocalizedSlugs() {
        try {
          setIsLoading(true)
          
          let apiUrl: string
          
          if (contentId && effectiveContentType) {
            apiUrl = `/api/${effectiveContentType}/${contentId}/slugs`
          } else {
            // We need to first get the content by slug to get its ID
            const contentResponse = await fetch(
              `/api/${effectiveContentType}/by-slug?slug=${effectiveSlug}&locale=${currentLocale}`
            )
            
            if (!contentResponse.ok) {
              throw new Error('Failed to fetch content information')
            }
            
            const contentData = await contentResponse.json()
            apiUrl = `/api/${effectiveContentType}/${contentData.id}/slugs`
          }
          
          const response = await fetch(apiUrl)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch localized slugs: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          if (data && data.slugs) {
            setLocalizedSlugs(data.slugs)
          }
        } catch (error) {
          console.error('Error fetching localized slugs:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchLocalizedSlugs()
    }
  }, [contentId, effectiveContentType, effectiveSlug, currentLocale])
  
  // Function to generate link for a specific locale
  const getLocalizedLink = (locale: string) => {
    // If we have localized slugs, use them
    if (localizedSlugs[locale] && effectiveContentType) {
      return `/${locale}/${effectiveContentType}/${localizedSlugs[locale]}`
    }
    
    // If not on a content page or no slug available for this locale,
    // simply replace the locale in the current path
    const pathParts = pathname.split('/')
    pathParts[1] = locale
    return pathParts.join('/')
  }
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(prev => !prev)
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = () => {
      setIsOpen(false)
    }
    
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])
  
  // Horizontal variant (list of languages)
  if (variant === 'horizontal') {
    return (
      <div className={`language-selector-horizontal ${className}`}>
        <ul className="language-list">
          {SUPPORTED_LOCALES.map(locale => (
            <li 
              key={locale} 
              className={`language-item ${locale === currentLocale ? 'active' : ''}`}
            >
              <LocalizedLink 
                href={getLocalizedLink(locale)}
                className={`language-link ${locale === currentLocale ? 'active' : ''}`}
              >
                {LOCALE_METADATA[locale]?.name || locale}
              </LocalizedLink>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
  // Dropdown variant (default)
  return (
    <div className={`language-selector-dropdown ${className}`}>
      <button 
        onClick={e => { e.stopPropagation(); toggleDropdown() }}
        className={`language-selector-button ${buttonClassName}`}
      >
        {LOCALE_METADATA[currentLocale]?.name || currentLocale}
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <ul className={`language-dropdown ${dropdownClassName}`}>
          {SUPPORTED_LOCALES.map(locale => (
            <li 
              key={locale} 
              className={`language-item ${locale === currentLocale ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <LocalizedLink 
                href={getLocalizedLink(locale)}
                className={`language-link ${locale === currentLocale ? 'active' : ''}`}
              >
                {LOCALE_METADATA[locale]?.name || locale}
              </LocalizedLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 