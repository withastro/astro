---
'astro': patch
---

Fixes `matchAllRoutes` to consider `fallbackRoutes`, matching `matchRoute` and the production router. Dev-server i18n fallback requests now resolve to the source route's metadata instead of the 404 route, and SSR-only fallback candidates can fall through the prerender handler.
