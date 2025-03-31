import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/[contentType]/by-slug/route'
import { validateSlug } from '@/app/utils/slug'
import { getContentBySlug } from '@/app/utils/content'

// Mock the utility functions
vi.mock('@/app/utils/content', () => ({
  getContentBySlug: vi.fn()
}))

vi.mock('@/app/utils/slug', () => ({
  validateSlug: vi.fn(() => ({ isValid: true, error: null }))
}))

describe('Content API Endpoints', () => {
  describe('/api/[contentType]/by-slug', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })
    
    it('should return 400 for invalid content type', async () => {
      // Create a mock request
      const request = new NextRequest(new URL('http://localhost/api/invalid/by-slug?slug=test-slug&locale=en'))
      
      // Override the request context to include params
      const context = {
        params: {
          contentType: 'invalid'
        }
      }
      
      const response = await GET(request, context)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid content type')
    })
    
    it('should return 400 if no slug is provided', async () => {
      // Create a mock request without a slug parameter
      const request = new NextRequest(new URL('http://localhost/api/blog/by-slug?locale=en'))
      
      // Override the request context to include params
      const context = {
        params: {
          contentType: 'blog'
        }
      }
      
      const response = await GET(request, context)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Slug is required')
    })
    
    it('should return 400 if the slug is invalid', async () => {
      // Mock validateSlug to return invalid
      vi.mocked(validateSlug).mockReturnValueOnce({ isValid: false, error: 'Invalid slug format' })
      
      // Create a mock request
      const request = new NextRequest(new URL('http://localhost/api/blog/by-slug?slug=Invalid@Slug&locale=en'))
      
      // Override the request context to include params
      const context = {
        params: {
          contentType: 'blog'
        }
      }
      
      const response = await GET(request, context)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid slug format')
    })
    
    it('should return 404 if content is not found', async () => {
      // Mock getContentBySlug to return null
      vi.mocked(getContentBySlug).mockResolvedValueOnce(null)
      
      // Create a mock request
      const request = new NextRequest(new URL('http://localhost/api/blog/by-slug?slug=test-slug&locale=en'))
      
      // Override the request context to include params
      const context = {
        params: {
          contentType: 'blog'
        }
      }
      
      const response = await GET(request, context)
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Content not found')
    })
    
    it('should return content if found', async () => {
      // Mock content data
      const mockContent = {
        id: 1,
        title: 'Test Blog',
        slug: 'test-slug',
        locale: 'en'
      }
      
      // Mock getContentBySlug to return content
      vi.mocked(getContentBySlug).mockResolvedValueOnce(mockContent)
      
      // Create a mock request
      const request = new NextRequest(new URL('http://localhost/api/blog/by-slug?slug=test-slug&locale=en'))
      
      // Override the request context to include params
      const context = {
        params: {
          contentType: 'blog'
        }
      }
      
      const response = await GET(request, context)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockContent)
    })
    
    it('should use default locale if no locale is provided', async () => {
      // Mock content data
      const mockContent = {
        id: 1,
        title: 'Test Blog',
        slug: 'test-slug',
        locale: 'de'
      }
      
      // Mock getContentBySlug to return content
      vi.mocked(getContentBySlug).mockResolvedValueOnce(mockContent)
      
      // Create a mock request without locale parameter
      const request = new NextRequest(new URL('http://localhost/api/blog/by-slug?slug=test-slug'))
      
      // Override the request context to include params
      const context = {
        params: {
          contentType: 'blog'
        }
      }
      
      // Mock the process.env
      const originalEnv = process.env
      process.env = { ...originalEnv, NEXT_PUBLIC_DEFAULT_LOCALE: 'de' }
      
      try {
        const response = await GET(request, context)
      
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toEqual(mockContent)
        
        // Verify getContentBySlug was called with default locale
        expect(getContentBySlug).toHaveBeenCalledWith('blog', 'test-slug', 'de')
      } finally {
        // Restore the original process.env
        process.env = originalEnv
      }
    })
  })
}) 