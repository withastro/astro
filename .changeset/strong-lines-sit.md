---
'astro': patch
---

Fixes i18n `fallbackType: "rewrite"` returning 500 instead of 404 when the fallback locale also has no matching static path for a prerendered dynamic route
