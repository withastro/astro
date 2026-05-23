---
'astro': patch
---

Fixes dynamic routes returning 500 "TypeError: Missing parameter" when using domain-based i18n routing (`domains-prefix-other-locales`, `domains-prefix-always`, or `domains-prefix-always-no-redirect`) in SSR.

When a non-default locale was mapped to a separate domain via `i18n.domains`, the locale-prefixed pathname computed during route matching was not passed through to the rendering context. This caused param extraction to fail for dynamic routes (e.g. `/boats/[id]/[slug]`) because the route pattern expected the locale prefix but the pathname used for matching did not include it.
