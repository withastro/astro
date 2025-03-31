import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/app/db'
import { getAllLocalizedSlugs, getContentBySlug, getLocalizedSlug } from '@/app/utils/content'
import { blogs, blogTranslations, projects, projectTranslations, contentCategories, contentCategoryTranslations, pages, pageTranslations } from '@/app/db/schema'

// Mock the DB and schema
vi.mock('@/app/db', () => ({
  db: {
    select: vi.fn(),
    execute: vi.fn(),
  }
}))

vi.mock('@/app/db/schema', () => ({
  blogs: { id: 'blogs.id' },
  blogTranslations: { 
    parentId: 'blogTranslations.parentId', 
    locale: 'blogTranslations.locale',
    slug: 'blogTranslations.slug'
  },
  projects: { id: 'projects.id' },
  projectTranslations: { 
    parentId: 'projectTranslations.parentId', 
    locale: 'projectTranslations.locale',
    slug: 'projectTranslations.slug'
  },
  contentCategories: { id: 'contentCategories.id' },
  contentCategoryTranslations: { 
    parentId: 'contentCategoryTranslations.parentId', 
    locale: 'contentCategoryTranslations.locale',
    slug: 'contentCategoryTranslations.slug'
  },
  pages: { id: 'pages.id' },
  pageTranslations: { 
    parentId: 'pageTranslations.parentId', 
    locale: 'pageTranslations.locale',
    slug: 'pageTranslations.slug'
  }
}))

// Mock the DB interactions
const mockDbOperations = () => {
  const selectMock = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        execute: vi.fn()
      })),
      leftJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: vi.fn()
        }))
      }))
    }))
  }))
  
  vi.mocked(db).select = selectMock
  
  return { selectMock }
}

describe('getContentBySlug', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockDbOperations()
  })
  
  it('should query the database with the right parameters for blogs', async () => {
    const mockExecute = vi.fn().mockResolvedValue([{ id: 1, title: 'Test Blog' }])
    
    vi.mocked(db).select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: mockExecute
          })
        })
      })
    })
    
    const result = await getContentBySlug('blog', 'test-blog', 'en')
    
    expect(db.select).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(result).toEqual({ id: 1, title: 'Test Blog' })
  })
  
  it('should return null if no content is found', async () => {
    const mockExecute = vi.fn().mockResolvedValue([])
    
    vi.mocked(db).select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: mockExecute
          })
        })
      })
    })
    
    const result = await getContentBySlug('blog', 'non-existent', 'en')
    
    expect(db.select).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(result).toBeNull()
  })
  
  it('should try the default locale if content is not found in the requested locale', async () => {
    const mockExecuteFirst = vi.fn().mockResolvedValue([])
    const mockExecuteSecond = vi.fn().mockResolvedValue([{ id: 1, title: 'Test Blog' }])
    
    vi.mocked(db).select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: mockExecuteFirst
          })
        })
      })
    }).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: mockExecuteSecond
          })
        })
      })
    })
    
    // Mock the process.env
    const originalEnv = process.env
    process.env = { ...originalEnv, NEXT_PUBLIC_DEFAULT_LOCALE: 'de' }
    
    try {
      const result = await getContentBySlug('blog', 'test-blog', 'en')
      
      expect(db.select).toHaveBeenCalledTimes(2)
      expect(mockExecuteFirst).toHaveBeenCalled()
      expect(mockExecuteSecond).toHaveBeenCalled()
      expect(result).toEqual({ id: 1, title: 'Test Blog' })
    } finally {
      // Restore the original process.env
      process.env = originalEnv
    }
  })
})

describe('getLocalizedSlug', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockDbOperations()
  })
  
  it('should query for a localized slug with the right parameters', async () => {
    const mockExecute = vi.fn().mockResolvedValue([{ slug: 'test-blog-de' }])
    
    vi.mocked(db).select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: mockExecute
        })
      })
    })
    
    const result = await getLocalizedSlug(1, 'blog', 'de')
    
    expect(db.select).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(result).toBe('test-blog-de')
  })
  
  it('should return null if no slug is found for the given locale', async () => {
    const mockExecute = vi.fn().mockResolvedValue([])
    
    vi.mocked(db).select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: mockExecute
        })
      })
    })
    
    const result = await getLocalizedSlug(1, 'blog', 'en')
    
    expect(db.select).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(result).toBeNull()
  })
  
  it('should try the default locale if no slug is found for the requested locale', async () => {
    const mockExecuteFirst = vi.fn().mockResolvedValue([])
    const mockExecuteSecond = vi.fn().mockResolvedValue([{ slug: 'test-blog-default' }])
    
    vi.mocked(db).select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: mockExecuteFirst
        })
      })
    }).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: mockExecuteSecond
        })
      })
    })
    
    // Mock the process.env
    const originalEnv = process.env
    process.env = { ...originalEnv, NEXT_PUBLIC_DEFAULT_LOCALE: 'de' }
    
    try {
      const result = await getLocalizedSlug(1, 'blog', 'en')
      
      expect(db.select).toHaveBeenCalledTimes(2)
      expect(mockExecuteFirst).toHaveBeenCalled()
      expect(mockExecuteSecond).toHaveBeenCalled()
      expect(result).toBe('test-blog-default')
    } finally {
      // Restore the original process.env
      process.env = originalEnv
    }
  })
})

describe('getAllLocalizedSlugs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockDbOperations()
  })
  
  it('should query for all localized slugs with the right parameters', async () => {
    const mockExecute = vi.fn().mockResolvedValue([
      { locale: 'en', slug: 'test-blog-en' },
      { locale: 'de', slug: 'test-blog-de' },
      { locale: 'fr', slug: 'test-blog-fr' }
    ])
    
    vi.mocked(db).select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: mockExecute
        })
      })
    })
    
    const result = await getAllLocalizedSlugs(1, 'blog')
    
    expect(db.select).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(result).toEqual({
      en: 'test-blog-en',
      de: 'test-blog-de',
      fr: 'test-blog-fr'
    })
  })
  
  it('should return an empty object if no slugs are found', async () => {
    const mockExecute = vi.fn().mockResolvedValue([])
    
    vi.mocked(db).select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: mockExecute
        })
      })
    })
    
    const result = await getAllLocalizedSlugs(1, 'blog')
    
    expect(db.select).toHaveBeenCalled()
    expect(mockExecute).toHaveBeenCalled()
    expect(result).toEqual({})
  })
}) 