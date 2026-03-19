---
'astro': patch
---

Fixes an issue where `Astro.currentLocale` would always be the default locale instead of the actual one when using a dynamic route like `[locale].astro` or `[locale]/index.astro`. It now resolves to the correct locale from the URL.
