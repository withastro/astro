---
'astro': patch
'@astrojs/sitemap': patch
---

Fixes i18n fallback pages missing from the generated sitemap

When using i18n with `fallbackType: 'rewrite'`, the fallback locale pages (e.g., `/fr/about/`) were correctly generated as HTML files but excluded from the sitemap. This happened because:

1. `addPageName` in `generate.ts` only tracked routes with `type: 'page'`, skipping `type: 'fallback'` routes
2. The sitemap integration's route filter also excluded fallback routes

Both are now updated to include fallback routes.
