---
'astro': patch
---

Fixes `matchAllRoutes` ignoring `fallbackRoutes`, so i18n fallback routes now match in the dev server like they do in `matchRoute`. Fallback requests resolve to the source route's metadata instead of the 404 route, and SSR-only fallback candidates can fall through the prerender handler.
