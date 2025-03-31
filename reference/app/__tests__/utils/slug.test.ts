import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateLocalizedSlug, slugify, validateSlug, checkSlugExists } from '@/app/utils/slug'

// Mock the DB interaction functions
vi.mock('@/app/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: vi.fn(() => [])
        }))
      }))
    })),
  }
}))

// Mock the checkSlugExists function internally
vi.mock('@/app/utils/slug', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    checkSlugExists: vi.fn(() => Promise.resolve(false))
  }
})

// Define the module type
type SlugModule = {
  generateLocalizedSlug: typeof generateLocalizedSlug;
  slugify: typeof slugify;
  validateSlug: typeof validateSlug;
  checkSlugExists: typeof checkSlugExists;
}

describe('slugify', () => {
  it('should convert a simple string to slug format', () => {
    const result = slugify('Hello World')
    expect(result).toBe('hello-world')
  })

  it('should handle special characters', () => {
    const result = slugify('Hello & World! #Special')
    expect(result).toBe('hello-world-special')
  })

  it('should handle multiple spaces and hyphens', () => {
    const result = slugify('Hello  World -- Test')
    expect(result).toBe('hello-world-test')
  })

  it('should handle non-alphanumeric characters', () => {
    const result = slugify('$*()#@!Test')
    expect(result).toBe('test')
  })

  it('should handle empty strings', () => {
    const result = slugify('')
    expect(result).toBe('')
  })

  it('should handle German umlauts with default locale', () => {
    const result = slugify('Über Äpfel und Öl', { locale: 'de' })
    expect(result).toBe('ueber-aepfel-und-oel')
  })
  
  it('should handle German umlauts with preserveSpecialChars', () => {
    const result = slugify('Über Äpfel und Öl', { locale: 'de', preserveSpecialChars: true })
    expect(result).toBe('über-äpfel-und-öl')
  })

  it('should handle French accents with default locale', () => {
    const result = slugify('Café à la crème', { locale: 'fr' })
    expect(result).toBe('cafe-a-la-creme')
  })
  
  it('should handle French accents with preserveSpecialChars', () => {
    const result = slugify('Café à la crème', { locale: 'fr', preserveSpecialChars: true })
    expect(result).toBe('café-à-la-crème')
  })
})

describe('validateSlug', () => {
  it('should pass for a valid slug', () => {
    const result = validateSlug('valid-slug-123')
    expect(result.isValid).toBe(true)
    expect(result.error).toBe(null)
  })

  it('should fail for a slug with uppercase characters', () => {
    const result = validateSlug('Invalid-Slug')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('lowercase')
  })

  it('should fail for a slug with illegal characters', () => {
    const result = validateSlug('invalid@slug')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('only contain')
  })

  it('should fail for a slug that is too short', () => {
    const result = validateSlug('a')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('at least')
  })

  it('should fail for a slug that is too long', () => {
    // Create a slug that is 121 characters long
    const longSlug = 'a'.repeat(121)
    const result = validateSlug(longSlug)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('no more than')
  })

  it('should fail for a slug that starts or ends with a hyphen', () => {
    let result = validateSlug('-invalid-slug')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('start or end with')

    result = validateSlug('invalid-slug-')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('start or end with')
  })
})

describe('generateLocalizedSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a valid slug for a title', async () => {
    const slug = await generateLocalizedSlug('Test Title', 'blog', 'en')
    expect(slug).toBe('test-title')
  })

  it('should handle special characters in a title', async () => {
    const slug = await generateLocalizedSlug('Test & Title!', 'blog', 'en')
    expect(slug).toBe('test-title')
  })

  it('should handle locale-specific characters', async () => {
    const slug = await generateLocalizedSlug('Über Äpfel', 'blog', 'de')
    expect(slug).toBe('ueber-aepfel')
  })

  it('should append a random string if the slug already exists', async () => {
    const checkSlugExists = vi.fn()
      .mockResolvedValueOnce(true)  // First call - slug exists
      .mockResolvedValueOnce(false) // Second call - modified slug doesn't exist
    
    // Replace the imported function with our mock
    const actual = await import('@/app/utils/slug')
    const mockModule = actual as SlugModule
    const originalCheckSlugExists = mockModule.checkSlugExists
    mockModule.checkSlugExists = checkSlugExists
    
    try {
      const slug = await generateLocalizedSlug('Test Title', 'blog', 'en')
      expect(slug).toMatch(/^test-title-\w+$/)
      expect(checkSlugExists).toHaveBeenCalledTimes(2)
    } finally {
      // Restore the original function after test
      mockModule.checkSlugExists = originalCheckSlugExists
    }
  })
}) 