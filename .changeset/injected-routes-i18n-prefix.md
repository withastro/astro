---
'astro': patch
---

Fixes a bug where page routes added with `injectRoute()` returned a 404 when `i18n.routing.prefixDefaultLocale` was `true` and the route path had no locale prefix
