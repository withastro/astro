---
'astro': patch
---

Fixes `redirectToDefaultLocale` not working after the Advanced Routing refactoring. The internal `ROUTE_TYPE_HEADER` was being deleted by middleware finalization before the i18n handler could read it, preventing locale redirects and other i18n post-processing from being applied.
