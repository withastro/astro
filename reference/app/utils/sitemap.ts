import { eq } from 'drizzle-orm'
import { db } from '@/app/db'
import { 
  blogs, blogTranslations,
  contentCategories, contentCategoryTranslations,
  pages, pageTranslations,
  projects, projectTranslations
} from '@/app/db/schema'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/app/i18n/settings'

type ContentType = 'blog' | 'project' | 'category' | 'page'

interface SitemapEntry {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: { hreflang: string; href: string }[]
}

interface SitemapOptions {
  baseUrl: string
  includeAllLocales?: boolean
  defaultPriority?: number
  contentTypeConfigs?: Record<ContentType, {
    priority?: number
    changefreq?: SitemapEntry['changefreq']
  }>
}

/**
 * Default sitemap generation options
 */
const defaultOptions: SitemapOptions = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  includeAllLocales: true,
  defaultPriority: 0.5,
  contentTypeConfigs: {
    blog: { priority: 0.8, changefreq: 'weekly' },
    project: { priority: 0.7, changefreq: 'monthly' },
    category: { priority: 0.6, changefreq: 'monthly' },
    page: { priority: 0.9, changefreq: 'monthly' }
  }
}

/**
 * Formats a locale for hreflang attribute (e.g., 'en' becomes 'en-us')
 */
function formatHreflangLocale(locale: string): string {
  switch (locale) {
    case 'en': return 'en-us'
    case 'de': return 'de-de'
    case 'fr': return 'fr-fr'
    case 'it': return 'it-it'
    case 'es': return 'es-es'
    default: return locale
  }
}

/**
 * Creates a URL for the sitemap from components
 */
function createUrl(baseUrl: string, locale: string, contentType: ContentType, slug: string): string {
  // Ensure baseUrl has no trailing slash
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${base}/${locale}/${contentType}/${slug}`
}

/**
 * Fetches all blog posts with their translations for the sitemap
 */
async function getBlogSitemapEntries(options: SitemapOptions): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  const { baseUrl, includeAllLocales, contentTypeConfigs } = options
  
  // Get all blogs with their default locale translation
  const blogEntries = await db
    .select({
      id: blogs.id,
      createdAt: blogs.createdAt,
      updatedAt: blogs.updatedAt
    })
    .from(blogs)
    .execute()
  
  // For each blog, get all its translations
  for (const blog of blogEntries) {
    // Get all translations for this blog
    const translations = await db
      .select({
        locale: blogTranslations.locale,
        slug: blogTranslations.slug,
        updatedAt: blogTranslations.updatedAt
      })
      .from(blogTranslations)
      .where(eq(blogTranslations.parentId, blog.id))
      .execute()
    
    // If no translations are found, skip this blog
    if (translations.length === 0) continue
    
    // Find the default locale translation to use as the primary entry
    let defaultTranslation = translations.find(t => t.locale === DEFAULT_LOCALE)
    
    // If no default locale translation, use the first available
    if (!defaultTranslation) {
      defaultTranslation = translations[0]
    }
    
    // Create alternate links for all translations
    const alternates = translations.map(translation => ({
      hreflang: formatHreflangLocale(translation.locale),
      href: createUrl(baseUrl, translation.locale, 'blog', translation.slug)
    }))
    
    // Add x-default hreflang pointing to the default locale
    if (defaultTranslation) {
      alternates.push({
        hreflang: 'x-default',
        href: createUrl(baseUrl, defaultTranslation.locale, 'blog', defaultTranslation.slug)
      })
    }
    
    // If we want to include all locales in the sitemap
    if (includeAllLocales) {
      // Add an entry for each translated locale
      for (const translation of translations) {
        entries.push({
          url: createUrl(baseUrl, translation.locale, 'blog', translation.slug),
          lastmod: (translation.updatedAt || blog.updatedAt || blog.createdAt).toISOString().split('T')[0],
          changefreq: contentTypeConfigs?.blog?.changefreq || 'weekly',
          priority: contentTypeConfigs?.blog?.priority || 0.7,
          alternates
        })
      }
    } 
    // If we only want to include the default locale in the sitemap
    else if (defaultTranslation) {
      entries.push({
        url: createUrl(baseUrl, defaultTranslation.locale, 'blog', defaultTranslation.slug),
        lastmod: (defaultTranslation.updatedAt || blog.updatedAt || blog.createdAt).toISOString().split('T')[0],
        changefreq: contentTypeConfigs?.blog?.changefreq || 'weekly',
        priority: contentTypeConfigs?.blog?.priority || 0.7,
        alternates
      })
    }
  }
  
  return entries
}

/**
 * Fetches all projects with their translations for the sitemap
 */
async function getProjectSitemapEntries(options: SitemapOptions): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  const { baseUrl, includeAllLocales, contentTypeConfigs } = options
  
  // Get all projects with their default locale translation
  const projectEntries = await db
    .select({
      id: projects.id,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt
    })
    .from(projects)
    .execute()
  
  // For each project, get all its translations
  for (const project of projectEntries) {
    // Get all translations for this project
    const translations = await db
      .select({
        locale: projectTranslations.locale,
        slug: projectTranslations.slug,
        updatedAt: projectTranslations.updatedAt
      })
      .from(projectTranslations)
      .where(eq(projectTranslations.parentId, project.id))
      .execute()
    
    // If no translations are found, skip this project
    if (translations.length === 0) continue
    
    // Find the default locale translation to use as the primary entry
    let defaultTranslation = translations.find(t => t.locale === DEFAULT_LOCALE)
    
    // If no default locale translation, use the first available
    if (!defaultTranslation) {
      defaultTranslation = translations[0]
    }
    
    // Create alternate links for all translations
    const alternates = translations.map(translation => ({
      hreflang: formatHreflangLocale(translation.locale),
      href: createUrl(baseUrl, translation.locale, 'project', translation.slug)
    }))
    
    // Add x-default hreflang pointing to the default locale
    if (defaultTranslation) {
      alternates.push({
        hreflang: 'x-default',
        href: createUrl(baseUrl, defaultTranslation.locale, 'project', defaultTranslation.slug)
      })
    }
    
    // If we want to include all locales in the sitemap
    if (includeAllLocales) {
      // Add an entry for each translated locale
      for (const translation of translations) {
        entries.push({
          url: createUrl(baseUrl, translation.locale, 'project', translation.slug),
          lastmod: (translation.updatedAt || project.updatedAt || project.createdAt).toISOString().split('T')[0],
          changefreq: contentTypeConfigs?.project?.changefreq || 'monthly',
          priority: contentTypeConfigs?.project?.priority || 0.7,
          alternates
        })
      }
    } 
    // If we only want to include the default locale in the sitemap
    else if (defaultTranslation) {
      entries.push({
        url: createUrl(baseUrl, defaultTranslation.locale, 'project', defaultTranslation.slug),
        lastmod: (defaultTranslation.updatedAt || project.updatedAt || project.createdAt).toISOString().split('T')[0],
        changefreq: contentTypeConfigs?.project?.changefreq || 'monthly',
        priority: contentTypeConfigs?.project?.priority || 0.7,
        alternates
      })
    }
  }
  
  return entries
}

/**
 * Fetches all categories with their translations for the sitemap
 */
async function getCategorySitemapEntries(options: SitemapOptions): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  const { baseUrl, includeAllLocales, contentTypeConfigs } = options
  
  // Get all categories
  const categoryEntries = await db
    .select({
      id: contentCategories.id,
      createdAt: contentCategories.createdAt,
      updatedAt: contentCategories.updatedAt
    })
    .from(contentCategories)
    .execute()
  
  // For each category, get all its translations
  for (const category of categoryEntries) {
    // Get all translations for this category
    const translations = await db
      .select({
        locale: contentCategoryTranslations.locale,
        slug: contentCategoryTranslations.slug,
        updatedAt: contentCategoryTranslations.updatedAt
      })
      .from(contentCategoryTranslations)
      .where(eq(contentCategoryTranslations.parentId, category.id))
      .execute()
    
    // If no translations are found, skip this category
    if (translations.length === 0) continue
    
    // Find the default locale translation to use as the primary entry
    let defaultTranslation = translations.find(t => t.locale === DEFAULT_LOCALE)
    
    // If no default locale translation, use the first available
    if (!defaultTranslation) {
      defaultTranslation = translations[0]
    }
    
    // Create alternate links for all translations
    const alternates = translations.map(translation => ({
      hreflang: formatHreflangLocale(translation.locale),
      href: createUrl(baseUrl, translation.locale, 'category', translation.slug)
    }))
    
    // Add x-default hreflang pointing to the default locale
    if (defaultTranslation) {
      alternates.push({
        hreflang: 'x-default',
        href: createUrl(baseUrl, defaultTranslation.locale, 'category', defaultTranslation.slug)
      })
    }
    
    // If we want to include all locales in the sitemap
    if (includeAllLocales) {
      // Add an entry for each translated locale
      for (const translation of translations) {
        entries.push({
          url: createUrl(baseUrl, translation.locale, 'category', translation.slug),
          lastmod: (translation.updatedAt || category.updatedAt || category.createdAt).toISOString().split('T')[0],
          changefreq: contentTypeConfigs?.category?.changefreq || 'monthly',
          priority: contentTypeConfigs?.category?.priority || 0.6,
          alternates
        })
      }
    } 
    // If we only want to include the default locale in the sitemap
    else if (defaultTranslation) {
      entries.push({
        url: createUrl(baseUrl, defaultTranslation.locale, 'category', defaultTranslation.slug),
        lastmod: (defaultTranslation.updatedAt || category.updatedAt || category.createdAt).toISOString().split('T')[0],
        changefreq: contentTypeConfigs?.category?.changefreq || 'monthly',
        priority: contentTypeConfigs?.category?.priority || 0.6,
        alternates
      })
    }
  }
  
  return entries
}

/**
 * Fetches all pages with their translations for the sitemap
 */
async function getPageSitemapEntries(options: SitemapOptions): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  const { baseUrl, includeAllLocales, contentTypeConfigs } = options
  
  // Get all pages
  const pageEntries = await db
    .select({
      id: pages.id,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt
    })
    .from(pages)
    .execute()
  
  // For each page, get all its translations
  for (const page of pageEntries) {
    // Get all translations for this page
    const translations = await db
      .select({
        locale: pageTranslations.locale,
        slug: pageTranslations.slug,
        updatedAt: pageTranslations.updatedAt
      })
      .from(pageTranslations)
      .where(eq(pageTranslations.parentId, page.id))
      .execute()
    
    // If no translations are found, skip this page
    if (translations.length === 0) continue
    
    // Find the default locale translation to use as the primary entry
    let defaultTranslation = translations.find(t => t.locale === DEFAULT_LOCALE)
    
    // If no default locale translation, use the first available
    if (!defaultTranslation) {
      defaultTranslation = translations[0]
    }
    
    // Create alternate links for all translations
    const alternates = translations.map(translation => ({
      hreflang: formatHreflangLocale(translation.locale),
      href: createUrl(baseUrl, translation.locale, 'page', translation.slug)
    }))
    
    // Add x-default hreflang pointing to the default locale
    if (defaultTranslation) {
      alternates.push({
        hreflang: 'x-default',
        href: createUrl(baseUrl, defaultTranslation.locale, 'page', defaultTranslation.slug)
      })
    }
    
    // If we want to include all locales in the sitemap
    if (includeAllLocales) {
      // Add an entry for each translated locale
      for (const translation of translations) {
        entries.push({
          url: createUrl(baseUrl, translation.locale, 'page', translation.slug),
          lastmod: (translation.updatedAt || page.updatedAt || page.createdAt).toISOString().split('T')[0],
          changefreq: contentTypeConfigs?.page?.changefreq || 'monthly',
          priority: contentTypeConfigs?.page?.priority || 0.9,
          alternates
        })
      }
    } 
    // If we only want to include the default locale in the sitemap
    else if (defaultTranslation) {
      entries.push({
        url: createUrl(baseUrl, defaultTranslation.locale, 'page', defaultTranslation.slug),
        lastmod: (defaultTranslation.updatedAt || page.updatedAt || page.createdAt).toISOString().split('T')[0],
        changefreq: contentTypeConfigs?.page?.changefreq || 'monthly',
        priority: contentTypeConfigs?.page?.priority || 0.9,
        alternates
      })
    }
  }
  
  return entries
}

/**
 * Gets static pages (home page, etc.) for the sitemap
 */
function getStaticPageEntries(options: SitemapOptions): SitemapEntry[] {
  const { baseUrl, includeAllLocales, defaultPriority } = options
  const entries: SitemapEntry[] = []
  
  // Home page for each locale
  const homePageAlternates = SUPPORTED_LOCALES.map(locale => ({
    hreflang: formatHreflangLocale(locale),
    href: `${baseUrl}/${locale}`
  }))
  
  // Add x-default hreflang pointing to the default locale
  homePageAlternates.push({
    hreflang: 'x-default',
    href: `${baseUrl}/${DEFAULT_LOCALE}`
  })
  
  // Add home page for each locale if includeAllLocales is true
  if (includeAllLocales) {
    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}/${locale}`,
        priority: 1.0,
        changefreq: 'weekly',
        alternates: homePageAlternates
      })
    }
  } else {
    // Just add the default locale home page
    entries.push({
      url: `${baseUrl}/${DEFAULT_LOCALE}`,
      priority: 1.0,
      changefreq: 'weekly',
      alternates: homePageAlternates
    })
  }
  
  return entries
}

/**
 * Generates the full sitemap for the site with all localized content
 */
export async function generateSitemap(options: Partial<SitemapOptions> = {}): Promise<SitemapEntry[]> {
  // Merge provided options with defaults
  const mergedOptions: SitemapOptions = {
    ...defaultOptions,
    ...options,
    contentTypeConfigs: {
      ...defaultOptions.contentTypeConfigs,
      ...(options.contentTypeConfigs || {})
    }
  }
  
  // Collect entries from all content types
  const [blogEntries, projectEntries, categoryEntries, pageEntries, staticEntries] = await Promise.all([
    getBlogSitemapEntries(mergedOptions),
    getProjectSitemapEntries(mergedOptions),
    getCategorySitemapEntries(mergedOptions),
    getPageSitemapEntries(mergedOptions),
    Promise.resolve(getStaticPageEntries(mergedOptions))
  ])
  
  // Combine all entries
  return [
    ...staticEntries,
    ...blogEntries,
    ...projectEntries,
    ...categoryEntries,
    ...pageEntries
  ]
}

/**
 * Generates the XML string for the sitemap
 */
export function generateSitemapXml(entries: SitemapEntry[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  
  for (const entry of entries) {
    xml += '  <url>\n'
    xml += `    <loc>${entry.url}</loc>\n`
    
    if (entry.lastmod) {
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`
    }
    
    if (entry.changefreq) {
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`
    }
    
    if (entry.priority !== undefined) {
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`
    }
    
    // Add alternate language/locale links
    if (entry.alternates && entry.alternates.length > 0) {
      for (const alternate of entry.alternates) {
        xml += `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />\n`
      }
    }
    
    xml += '  </url>\n'
  }
  
  xml += '</urlset>'
  return xml
} 