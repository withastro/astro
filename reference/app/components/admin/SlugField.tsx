'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_LOCALE } from '@/app/i18n/settings'
import { generateLocalizedSlug, validateSlug } from '@/app/utils/slug'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface SlugFieldProps {
  contentType: ContentType
  contentId?: number
  title: string
  locale: string
  value: string
  onChange: (value: string) => void
  className?: string
  onValidationChange?: (isValid: boolean) => void
}

/**
 * A form field for managing slugs with validation and generation
 */
export default function SlugField({
  contentType,
  contentId,
  title,
  locale = DEFAULT_LOCALE,
  value,
  onChange,
  className = '',
  onValidationChange
}: SlugFieldProps) {
  const [isEditing, setIsEditing] = useState(!value)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingUnique, setIsCheckingUnique] = useState(false)
  
  // Validate slug on mount and when it changes
  const validateCurrentSlug = useCallback(() => {
    // Allow empty value (will be auto-generated later)
    if (!value) {
      setError(null)
      if (onValidationChange) onValidationChange(true)
      return
    }
    
    const validation = validateSlug(value)
    
    if (!validation.valid) {
      setError(validation.message)
      if (onValidationChange) onValidationChange(false)
      return
    }
    
    // Check uniqueness
    const checkUniqueness = async () => {
      try {
        setIsCheckingUnique(true)
        
        // Only need to check uniqueness if we have an existing slug value
        // and content ID (new items will be checked on save)
        if (value && contentId) {
          // We send a request to the API to check if this slug is unique
          const response = await fetch(`/api/${contentType}/by-slug?slug=${value}&locale=${locale}`)
          
          if (response.ok) {
            const data = await response.json()
            
            // If we find content with this slug that isn't the current content,
            // it means the slug is already in use
            if (data && data.id !== contentId) {
              setError('This slug is already in use')
              if (onValidationChange) onValidationChange(false)
              return
            }
          }
        }
        
        // If we get here, slug is valid and unique
        setError(null)
        if (onValidationChange) onValidationChange(true)
      } catch (error) {
        console.error('Error checking slug uniqueness:', error)
      } finally {
        setIsCheckingUnique(false)
      }
    }
    
    checkUniqueness()
  }, [value, contentId, contentType, locale, onValidationChange])
  
  useEffect(() => {
    validateCurrentSlug()
  }, [value, validateCurrentSlug])
  
  // Generate a slug from the title
  const generateSlug = async () => {
    if (!title) {
      setError('Title is required to generate a slug')
      return
    }
    
    try {
      setIsGenerating(true)
      
      // If we have a content ID, use the API to generate the slug
      if (contentId) {
        const response = await fetch(`/api/${contentType}/${contentId}/slug`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            locale,
            title
          })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to generate slug: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data && data.slug) {
          onChange(data.slug)
          setError(null)
          if (onValidationChange) onValidationChange(true)
        }
      } 
      // For new content without an ID, generate the slug locally
      else {
        const generatedSlug = await generateLocalizedSlug(title, contentType, locale)
        onChange(generatedSlug)
        setError(null)
        if (onValidationChange) onValidationChange(true)
      }
    } catch (error) {
      console.error('Error generating slug:', error)
      setError('Failed to generate slug')
      if (onValidationChange) onValidationChange(false)
    } finally {
      setIsGenerating(false)
      setIsEditing(false)
    }
  }
  
  return (
    <div className={`slug-field ${className} ${error ? 'has-error' : ''}`}>
      <div className="slug-input-wrapper">
        <label className="slug-label">
          Slug
        </label>
        
        <div className="slug-input-group">
          {isEditing ? (
            <>
              <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Enter a slug or generate from title"
                className={`slug-input ${error ? 'input-error' : ''}`}
              />
              
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="button view-mode"
                disabled={!value || !!error}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <div className="slug-display">
                {value ? (
                  <span className="slug-value">/{contentType}/{value}</span>
                ) : (
                  <span className="slug-placeholder">No slug set (will be auto-generated)</span>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="button edit-mode"
              >
                Edit
              </button>
            </>
          )}
          
          <button
            type="button"
            onClick={generateSlug}
            disabled={isGenerating || !title}
            className="button generate"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        
        {error && (
          <div className="slug-error">{error}</div>
        )}
        
        {isCheckingUnique && (
          <div className="slug-checking">Checking uniqueness...</div>
        )}
        
        <div className="slug-info">
          <p>Slugs should be URL-friendly, lowercase, and use hyphens instead of spaces.</p>
          <p>Good example: "my-awesome-content"</p>
        </div>
      </div>
    </div>
  )
} 