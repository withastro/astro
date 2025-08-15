---
'astro': patch
---

Ensure `Astro.currentLocale` returns a configured locale (instead of the `defaultLocale`) on localized index pages (like `fr-fr.html`) by removing `.html` from path segments before locale checks.
