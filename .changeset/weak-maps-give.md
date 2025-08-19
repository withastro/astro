---
'astro': patch
---

Ensures `Astro.currentLocale` returns the correct locale during SSG for pages that use a locale param (such as `[locale].astro` or `[locale]/index.astro`, which produce `[locale].html`)
