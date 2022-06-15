---
'@astrojs/sitemap': minor
---

# Key features

- Split up your large sitemap into multiple sitemaps by custom limit.
- Ability to add sitemap specific attributes such as `lastmod` etc.
- Final output customization via JS function.
- Localization support.
- Reliability: all config options are validated.

## Important changes

The integration always generates at least two files instead of one:

- `sitemap-index.xml` - index file;
- `sitemap-{i}.xml` - actual sitemap.
