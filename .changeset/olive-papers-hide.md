---
'astro': patch
---

Fixes a bug in i18n, where Astro caused an infinite loop when a locale that doesn't have an index, and Astro falls back to the index of the default locale.
