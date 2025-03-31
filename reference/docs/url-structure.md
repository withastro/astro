# URL Structure Standards for Localized Content

This document outlines the standardized URL structure for all content types across all supported locales.

## URL Pattern

All localized content follows this URL pattern:

```
/{locale}/{contentType}/{slug}
```

Where:
- `{locale}` is the two-letter language code (e.g., 'de', 'en', 'fr')
- `{contentType}` identifies the content category (blog, project, category, page)
- `{slug}` is the locale-specific SEO-friendly identifier for the content

## Content Types

| Content Type | URL Pattern                | Example URL                       |
|--------------|----------------------------|-----------------------------------|
| Blog posts   | /{locale}/blog/{slug}      | /en/blog/top-10-marketing-tips    |
| Projects     | /{locale}/project/{slug}   | /de/project/neue-website-launch   |
| Categories   | /{locale}/category/{slug}  | /fr/category/marketing-digital    |
| Pages        | /{locale}/page/{slug}      | /it/page/a-propos                 |

## Slug Format Guidelines

All slugs should follow these guidelines:

1. **All lowercase letters**
2. **Use hyphens (-) as separators**, not underscores or spaces
3. **No special characters** except hyphens
4. **Short and descriptive**, ideally between 3-5 words
5. **Include relevant keywords** for SEO
6. **Locale-specific for proper SEO**, (e.g., German slugs for German content)

### Locale-Specific Considerations

Different locales have specific rules for handling special characters:

- **German (de)**: 
  - Umlauts can be kept (ä, ö, ü) or transliterated (ae, oe, ue)
  - Example: "über-uns" or "ueber-uns"

- **French (fr)**:
  - Accents are removed: é → e, è → e, ê → e, etc.
  - Example: "actualités" → "actualites"

- **Spanish (es)**:
  - Tilde (ñ) is converted to n
  - Accents are removed: á → a, é → e, etc.
  - Example: "año nuevo" → "ano-nuevo"

- **Other locales**:
  - Special characters are generally removed or converted to their base form

## Legacy URL Handling

For backward compatibility, legacy non-localized URLs are automatically redirected:

| Legacy URL                | Redirects To (for German user)     | Status Code |
|---------------------------|-----------------------------------|-------------|
| /blog/my-post             | /de/blog/my-post                  | 301         |
| /project/new-launch       | /de/project/new-launch            | 301         |

## Canonical URLs

Each page should include a canonical URL in its metadata:

```html
<link rel="canonical" href="https://www.example.com/en/blog/my-blog-post" />
```

## Hreflang Implementation

All pages should include hreflang tags for all available translations:

```html
<link rel="alternate" hreflang="en-us" href="https://www.example.com/en/blog/my-blog-post" />
<link rel="alternate" hreflang="de-de" href="https://www.example.com/de/blog/mein-blog-post" />
<link rel="alternate" hreflang="fr-fr" href="https://www.example.com/fr/blog/mon-article-de-blog" />
<link rel="alternate" hreflang="x-default" href="https://www.example.com/de/blog/mein-blog-post" />
```

## URL Character Limits

- Maximum slug length: 100 characters
- Recommended slug length: 20-60 characters

## SEO Best Practices

1. **Avoid URL parameters** when possible
2. **Don't change URLs** after publishing if possible
3. **Use redirects** if URLs must be changed
4. **Include focus keywords** in the slug
5. **Keep URLs human-readable**

## Technical Implementation

The implementation of this URL structure is handled by:

1. **Database constraints** ensuring unique slugs per locale
2. **Slug generation utilities** with locale-specific transliteration rules
3. **Dynamic route handlers** supporting the `/{locale}/{contentType}/{slug}` pattern
4. **Middleware** for handling legacy URL redirection
5. **SEO components** for adding proper canonical URLs and hreflang tags

## Exceptions

Some special pages might not follow the standard pattern:

- Home page: `/{locale}`
- User account pages: `/{locale}/account/*`
- Search results: `/{locale}/search`

## Testing URLs

When implementing a new content type or modifying URL structure, ensure:

1. All URLs are reachable
2. Proper status codes are returned
3. Redirects work correctly
4. SEO metadata (canonical URLs, hreflang tags) is correct 