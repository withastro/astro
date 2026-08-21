---
'astro': patch
---

Fixes an issue where i18n fallback routes with `rewrite` strategy returned a 500 error instead of 404 when the fallback target has no matching static path (e.g. rest-param routes).
