---
'astro': patch
---

Ensure `Astro.currentLocale` returns a configured locale (instead of the `defaultLocale`) during SSG on pages that use a locale param and `getStaticPaths` (such as `[locale].astro` or `[locale]/index.astro`, which produce `[locale].html`) by removing `.html` from the path before locale checks.
