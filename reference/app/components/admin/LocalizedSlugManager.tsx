'use client'

import { useEffect, useState } from 'react'
import { LOCALE_METADATA, SUPPORTED_LOCALES } from '@/app/i18n/settings'
import { validateSlug } from '@/app/utils/slug'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface LocalizedSlugManagerProps {
  contentId: number
  contentType: ContentType
  title: string
  onChange?: (slugs: Record<string, string>) => void
  className?: string
}

/**
 * Admin component for managing localized slugs for a content item
 * Allows viewing, editing, and generating slugs for all supported locales
 */
export default function LocalizedSlugManager({
  contentId,
  contentType,
  title,
  onChange,
  className = ''
}: LocalizedSlugManagerProps) {
  const [slugs, setSlugs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  
  // Fetch all localized slugs for this content
  useEffect(() => {
    async function fetchSlugs() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/${contentType}/${contentId}/slugs`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch slugs: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data && data.slugs) {
          setSlugs(data.slugs)
          
          // Notify parent component if needed
          if (onChange) {
            onChange(data.slugs)
          }
        }
      } catch (error) {
        console.error('Error fetching slugs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (contentId) {
      fetchSlugs()
    }
  }, [contentId, contentType, onChange])
  
  // Handle input change for a specific locale
  const handleSlugChange = (locale: string, value: string) => {
    // Clear any previous success message
    setSuccessMessage('')
    
    // Clear error for this locale
    if (errors[locale]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[locale]
        return newErrors
      })
    }
    
    setSlugs(prev => ({
      ...prev,
      [locale]: value
    }))
  }
  
  // Validate a single slug
  const validateSingleSlug = (locale: string, slug: string) => {
    if (!slug) {
      setErrors(prev => ({
        ...prev,
        [locale]: 'Slug is required'
      }))
      return false
    }
    
    const validation = validateSlug(slug)
    if (!validation.valid) {
      setErrors(prev => ({
        ...prev,
        [locale]: validation.message
      }))
      return false
    }
    
    return true
  }
  
  // Generate a slug for a specific locale
  const generateSlug = async (locale: string) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/${contentType}/${contentId}/slug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locale,
          title: `${title} ${locale !== 'en' ? `(${LOCALE_METADATA[locale]?.name})` : ''}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate slug: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data && data.slug) {
        // Update local state
        setSlugs(prev => ({
          ...prev,
          [locale]: data.slug
        }))
        
        setSuccessMessage(`Generated slug for ${LOCALE_METADATA[locale]?.name || locale}`)
        
        // Clear any error for this locale
        if (errors[locale]) {
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[locale]
            return newErrors
          })
        }
        
        // Notify parent component if needed
        if (onChange) {
          onChange({
            ...slugs,
            [locale]: data.slug
          })
        }
      }
    } catch (error) {
      console.error('Error generating slug:', error)
      setErrors(prev => ({
        ...prev,
        [locale]: 'Failed to generate slug'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Update a single slug
  const updateSlug = async (locale: string) => {
    const slug = slugs[locale]
    
    // Validate slug
    if (!validateSingleSlug(locale, slug)) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/${contentType}/${contentId}/slug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locale,
          slug
        })
      })
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          setErrors(prev => ({
            ...prev,
            [locale]: 'This slug already exists for another content item'
          }))
          return
        }
        
        throw new Error(`Failed to update slug: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      setSuccessMessage(`Updated slug for ${LOCALE_METADATA[locale]?.name || locale}`)
      
      // Notify parent component if needed
      if (onChange) {
        onChange(slugs)
      }
    } catch (error) {
      console.error('Error updating slug:', error)
      setErrors(prev => ({
        ...prev,
        [locale]: 'Failed to update slug'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Update all slugs at once
  const updateAllSlugs = async () => {
    // Validate all slugs first
    let isValid = true
    const newErrors: Record<string, string> = {}
    
    // Check which locales have slugs that need validation
    Object.entries(slugs).forEach(([locale, slug]) => {
      if (slug) {
        const validation = validateSlug(slug)
        if (!validation.valid) {
          newErrors[locale] = validation.message
          isValid = false
        }
      }
    })
    
    if (!isValid) {
      setErrors(newErrors)
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Send update requests for all locales with slugs
      const updatePromises = Object.entries(slugs).map(([locale, slug]) => {
        if (!slug) return Promise.resolve()
        
        return fetch(`/api/${contentType}/${contentId}/slug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            locale,
            slug
          })
        })
      })
      
      const results = await Promise.allSettled(updatePromises)
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected')
      
      if (failures.length > 0) {
        setSuccessMessage(`Updated ${results.length - failures.length} of ${results.length} slugs`)
      } else {
        setSuccessMessage('Successfully updated all slugs')
      }
      
      // Refresh slug data
      const response = await fetch(`/api/${contentType}/${contentId}/slugs`)
      const data = await response.json()
      
      if (data && data.slugs) {
        setSlugs(data.slugs)
        
        // Notify parent component if needed
        if (onChange) {
          onChange(data.slugs)
        }
      }
    } catch (error) {
      console.error('Error updating all slugs:', error)
      setErrors({
        general: 'Failed to update all slugs'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Generate slugs for all locales
  const generateAllSlugs = async () => {
    try {
      setIsSubmitting(true)
      
      // Generate slugs for all supported locales
      const generatePromises = SUPPORTED_LOCALES.map(locale => {
        return fetch(`/api/${contentType}/${contentId}/slug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            locale,
            title: `${title} ${locale !== 'en' ? `(${LOCALE_METADATA[locale]?.name})` : ''}`
          })
        })
      })
      
      const results = await Promise.allSettled(generatePromises)
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected')
      
      if (failures.length > 0) {
        setSuccessMessage(`Generated ${results.length - failures.length} of ${results.length} slugs`)
      } else {
        setSuccessMessage('Successfully generated all slugs')
      }
      
      // Refresh slug data
      const response = await fetch(`/api/${contentType}/${contentId}/slugs`)
      const data = await response.json()
      
      if (data && data.slugs) {
        setSlugs(data.slugs)
        
        // Notify parent component if needed
        if (onChange) {
          onChange(data.slugs)
        }
      }
    } catch (error) {
      console.error('Error generating all slugs:', error)
      setErrors({
        general: 'Failed to generate all slugs'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return <div className="loading">Loading slug data...</div>
  }
  
  return (
    <div className={`localized-slug-manager ${className}`}>
      <h3>Manage Localized Slugs</h3>
      
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      
      <div className="slug-actions">
        <button 
          onClick={updateAllSlugs}
          disabled={isSubmitting}
          className="button update-all"
        >
          Save All Slugs
        </button>
        
        <button 
          onClick={generateAllSlugs}
          disabled={isSubmitting}
          className="button generate-all"
        >
          Generate All Slugs
        </button>
      </div>
      
      <div className="slug-list">
        {SUPPORTED_LOCALES.map(locale => (
          <div key={locale} className="slug-item">
            <div className="locale-label">
              {LOCALE_METADATA[locale]?.name || locale}
            </div>
            
            <div className="slug-input-group">
              <input
                type="text"
                value={slugs[locale] || ''}
                onChange={e => handleSlugChange(locale, e.target.value)}
                placeholder={`Slug for ${LOCALE_METADATA[locale]?.name || locale}`}
                className={`slug-input ${errors[locale] ? 'has-error' : ''}`}
              />
              
              <button
                onClick={() => updateSlug(locale)}
                disabled={isSubmitting}
                className="button update-slug"
              >
                Save
              </button>
              
              <button
                onClick={() => generateSlug(locale)}
                disabled={isSubmitting}
                className="button generate-slug"
              >
                Generate
              </button>
            </div>
            
            {errors[locale] && (
              <div className="error-message">{errors[locale]}</div>
            )}
            
            {slugs[locale] && (
              <div className="slug-preview">
                /{contentType}/{slugs[locale]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 