# Localized Slugs: Developer Documentation

## Overview

This document provides technical documentation for developers working with the localized slug system in the OnlineMarketingCORE platform. The system enables content to have unique, SEO-friendly URLs across multiple languages, improving both user experience and search engine visibility.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Utilities](#utilities)
5. [Middleware](#middleware)
6. [Components](#components)
7. [Testing](#testing)
8. [Migration Tools](#migration-tools)
9. [Troubleshooting](#troubleshooting)

## Architecture

The localized slug system is built on a multi-layered architecture:

```
┌─────────────────┐
│  Frontend       │ React components for slug management and navigation
└────────┬────────┘
         │
┌────────▼────────┐
│  API Layer      │ Next.js API routes for content and slug operations
└────────┬────────┘
         │
┌────────▼────────┐
│  Utility Layer  │ Helper functions for slug generation and validation
└────────┬────────┘
         │
┌────────▼────────┐
│  Database Layer │ Drizzle ORM schema with locale-specific constraints
└─────────────────┘
```

Each content type (blog, project, category, page) has its own localized slugs, enforced by database constraints to ensure uniqueness within each locale.

## Database Schema

### Key Tables

- **ContentType Tables**: `blog`, `project`, `category`, `page`
- **Translation Tables**: `blog_translation`, `project_translation`, `category_translation`, `page_translation`

### Constraints

Each translation table includes a composite unique constraint:

```sql
ALTER TABLE [table_name]_translation 
ADD CONSTRAINT unique_[table_name]_slug_locale 
UNIQUE (slug, locale);
```

This ensures that slugs are unique within each locale for each content type.

## API Reference

### Content Retrieval Endpoints

#### GET `/api/[contentType]/by-slug`

Retrieves content by slug with locale support.

**Parameters:**
- `slug`: The URL slug to lookup
- `locale`: The locale code (e.g., 'en', 'de', 'fr')
- `contentType`: The content type (path parameter)

**Response:**
```json
{
  "content": { /* Content object */ },
  "metadata": {
    "locale": "en",
    "fallbackUsed": false,
    "canonicalSlug": "example-slug"
  }
}
```

**Error Responses:**
- 400: Invalid parameters
- 404: Content not found
- 500: Server error

#### GET `/api/[contentType]/[contentId]/slugs`

Retrieves all localized slugs for a specific content item.

**Parameters:**
- `contentType`: The content type (path parameter)
- `contentId`: The ID of the content item (path parameter)

**Response:**
```json
{
  "slugs": {
    "en": "example-slug",
    "de": "beispiel-slug",
    "fr": "exemple-slug"
  }
}
```

### Slug Management Endpoints

#### POST `/api/[contentType]/validate-slug`

Validates a slug for uniqueness within a locale.

**Request Body:**
```json
{
  "slug": "example-slug",
  "locale": "en",
  "contentId": "optional-existing-content-id"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Slug is available"
}
```

#### POST `/api/[contentType]/generate-slug`

Generates a slug from a title.

**Request Body:**
```json
{
  "title": "Example Title",
  "locale": "en"
}
```

**Response:**
```json
{
  "slug": "example-title"
}
```

## Utilities

### Slug Generation (`app/utils/slug.ts`)

- `generateSlug(title: string, locale: string)`: Generates a slug from a title, using locale-specific transliteration rules
- `validateSlug(slug: string)`: Validates a slug against format requirements
- `isSlugUnique(slug: string, contentType: string, locale: string, excludeId?: string)`: Checks if a slug is unique within a content type and locale

### Content Access (`app/utils/content.ts`)

- `getContentBySlug(slug: string, contentType: string, locale: string)`: Retrieves content by slug with locale fallback
- `getAllLocalizedSlugs(contentId: string, contentType: string)`: Gets all localized slugs for a content item

### SEO Utilities (`app/utils/seo.ts`)

- `getCanonicalUrl(locale: string, contentType: string, slug: string, options?: CanonicalUrlOptions)`: Constructs a canonical URL for content
- `generateHreflangTags(contentType: string, localizedSlugs: Record<string, string>)`: Generates hreflang tags for all localized versions
- `generateStructuredData(contentItem: ContentItem, localizedSlugs: Record<string, string>)`: Creates structured data with language attributes

## Middleware

### Locale Handling (`app/middleware.ts`)

Handles legacy URL redirection and locale detection with the following features:

- Detects user's preferred locale from browser settings and redirects accordingly
- Handles legacy URLs without locale prefixes and redirects to localized versions
- Manages cookie-based locale persistence

## Components

### Navigation Components

- `LocalizedLink`: Renders links with proper locale prefixes
- `LanguageSelector`: Allows users to switch between available languages

### Admin Components

- `SlugField`: Form field for managing slugs in admin forms
- `LocalizedSlugManager`: Interface for managing all localized versions of a slug

### SEO Components

- `ContentSeo`: Component to add SEO metadata to localized content pages

## Testing

The localized slug system includes comprehensive testing:

### Unit Tests

- Slug generation tests
- Validation function tests
- Locale fallback logic tests

### Integration Tests

- Database constraint tests
- API endpoint response tests
- Middleware redirect tests

### End-to-End Tests

- Navigation flow tests
- SEO validation tests

## Migration Tools

The system includes tools for migrating from a non-localized to a localized slug system:

- `SlugMigrationTool`: Admin interface for auditing and fixing missing slugs
- `app/utils/migration.ts`: Utilities for detecting and resolving slug issues

## Troubleshooting

Common issues and their solutions:

### Duplicate Slug Errors

If you encounter duplicate slug errors during migration:

1. Use the `SlugMigrationTool` to identify conflicts
2. Implement the resolution strategy (automatically append differentiators or manually rename)

### Missing Locale Fallbacks

If content is not displaying with locale fallbacks:

1. Check the `DEFAULT_LOCALE` setting in `app/i18n/settings.ts`
2. Ensure the content has a translation in the default locale
3. Verify the `getContentBySlug` function is properly handling fallbacks

### URL Structure Issues

If URLs are not following the expected structure:

1. Check the `middleware.ts` file for proper rewrite and redirect rules
2. Verify the `LocalizedLink` component is being used for all navigation links
3. Ensure the `getCanonicalUrl` function is correctly generating URLs

## Implementation Checklist

For new implementations or extensions of the localized slug system:

- [ ] Add database constraints for new content types
- [ ] Create/update API endpoints with locale support
- [ ] Implement slug generation rules specific to the content type
- [ ] Add proper SEO tags and canonical URLs
- [ ] Update sitemap generation to include all localized versions
- [ ] Test all functionality across supported locales 