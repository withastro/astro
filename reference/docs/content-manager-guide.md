# Localized Slugs: Content Manager Guide

## Introduction

This guide explains how to work with localized slugs in the OnlineMarketingCORE content management system. Localized slugs allow your content to have unique, language-specific URLs, improving multilingual SEO and user experience.

## What Are Localized Slugs?

A "slug" is the part of a URL that identifies a specific page in a human-readable form. For example, in the URL `https://example.com/en/blog/how-to-improve-seo`, the slug is `how-to-improve-seo`.

With our localized slug system:
- Each content item can have different slugs for different languages
- URLs include the language code, e.g., `/en/blog/how-to-improve-seo` for English
- Each language version can have an optimized slug for that language's keywords

## Creating Content with Localized Slugs

### Step 1: Access the Content Creation Form

1. Navigate to the admin section and select the content type you want to create
2. Click "Create New" to open the content creation form

### Step 2: Fill in Basic Content Information

1. Enter the title, description, and other required fields
2. Select the language/locale you are currently creating content for

### Step 3: Work with the Slug Field

![Slug Field Example](../assets/slug-field-example.png)

The Slug Field component has several features:
- **Auto-generation**: By default, a slug is automatically generated from the title
- **Edit button**: Click to manually edit the slug
- **Generate button**: Click to regenerate the slug based on the current title
- **Validation**: Real-time validation ensures the slug follows the correct format
- **Availability check**: The system checks if the slug is already in use

### Step 4: Save the Primary Content

1. Complete all required fields
2. Click "Save" to create the content with its first localized version

### Step 5: Add Additional Language Versions

1. From the content edit page, find the "Translations" tab
2. Click "Add Translation" and select the target language
3. Fill in the translated content
4. The system will automatically generate a localized slug, which you can customize
5. Save the translation to create the localized version

## Managing Existing Localized Slugs

### Viewing All Localized Slugs

1. Edit any content item
2. Go to the "Localized Slugs" tab
3. You'll see a table showing all available languages and their corresponding slugs

![Localized Slugs Manager](../assets/localized-slugs-manager.png)

### Editing a Localized Slug

1. Find the language version you want to update
2. Click the "Edit" button next to the corresponding slug
3. Make your changes to the slug
4. Click "Save" to update

### Best Practices for Slug Creation

1. **Keep it short and relevant**: 3-5 words is ideal
2. **Include important keywords**: Incorporate primary keywords for SEO
3. **Use hyphens between words**: For better readability
4. **Avoid special characters**: Stick to letters, numbers, and hyphens
5. **Consider language-specific keywords**: Use keywords that are relevant in each language
6. **Maintain consistency**: Use a similar pattern across all content

## Language-Specific Considerations

### German (de)

- Umlauts (ä, ö, ü) are automatically converted to ae, oe, ue
- You can preserve umlauts by checking "Preserve special characters" (advanced option)
- German tends to have longer compound words; consider breaking them up in slugs

### French (fr)

- Accented characters (é, è, à, etc.) are automatically converted to non-accented versions
- Pay attention to maintaining meaning when accents are removed

### Other Languages

- Each language follows specific transliteration rules to create valid URLs
- Always review the automatically generated slug for correctness

## URL Structure and SEO

The URL structure follows this pattern:
```
https://example.com/{language-code}/{content-type}/{slug}
```

For example:
- English blog post: `https://example.com/en/blog/how-to-improve-seo`
- German version: `https://example.com/de/blog/wie-man-seo-verbessert`

This structure provides several SEO benefits:
- Clear language indication for search engines
- Optimized keywords for each language
- Proper hreflang tags are automatically included
- Sitemaps include all language versions with proper annotations

## Troubleshooting Common Issues

### Slug Already Exists

If you get an "already exists" error when saving a slug:
1. Try a slightly different variation by adding more specific terms
2. Check if the existing content with that slug can be archived or renamed
3. Add a distinguishing word or number to make it unique

### Missing Slugs for Some Languages

If you notice content missing slugs for certain languages:
1. Go to Admin > Tools > Slug Migration
2. Run an audit to find all content with missing slugs
3. Use the automated fix to generate slugs for all missing content

### Redirected URLs

If users report being redirected to a different language version:
1. Check if the content has a translation in the requested language
2. Verify the slug exists for that specific language
3. If needed, create the missing translation with an appropriate slug

## Bulk Slug Management

For efficient management of multiple content items:

### Using the Slug Migration Tool

1. Navigate to Admin > Tools > Slug Migration
2. Click "Run Audit" to check for content items missing slugs
3. Review the audit results showing missing slugs per content type
4. Click "Fix Missing Slugs" to automatically generate slugs for all missing items
5. Review the report for any errors or issues

![Slug Migration Tool](../assets/slug-migration-tool.png)

### Generating Slugs in Bulk

When adding new language support or fixing multiple items:
1. Go to Admin > Tools > Slug Migration
2. Select the options for fixing missing slugs and resolving collisions
3. Run the migration process
4. Review the results and make any necessary manual adjustments

## Best Practices for Multilingual SEO

1. **Use localized keywords**: Research keywords specific to each language market
2. **Create unique meta descriptions**: Write unique meta descriptions for each language version
3. **Adapt content culturally**: Don't just translate; adapt content for cultural relevance
4. **Use language-specific URLs**: Which our localized slug system provides
5. **Implement proper hreflang tags**: These are automatically added by our system
6. **Create language-specific sitemaps**: Our system generates these automatically

## Getting Help

If you encounter any issues with localized slugs:
1. Check this documentation first for common solutions
2. Use the "?" help icon next to the slug field for context-specific guidance
3. Contact the development team via [support@example.com](mailto:support@example.com) for technical assistance

## Glossary

- **Slug**: The part of a URL that identifies a specific page in a readable format
- **Localized Slug**: A slug that is specific to a particular language version of content
- **Locale**: A combination of language and region (e.g., en-US, de-DE)
- **Transliteration**: Converting characters from one script to another while preserving pronunciation
- **Hreflang Tags**: HTML tags that tell search engines which language you're using on a specific page
- **Canonical URL**: The preferred version of a web page URL to prevent duplicate content issues 