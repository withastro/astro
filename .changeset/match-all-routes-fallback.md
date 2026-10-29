---
'astro': patch
---

fix `matchAllRoutes` so it considers `fallbackRoutes`, matching `matchRoute` and the production router. Dev-server i18n fallbacks that only match through a fallback route are resolved again.
