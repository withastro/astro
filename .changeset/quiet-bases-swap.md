---
'astro': patch
---

Fixes i18n paths being corrupted when the configured `base` contains a locale code as a substring. With `base: '/estore'` and `fallback: { es: 'en' }`, the `redirectToFallback()` helper from `astro:i18n` redirected `/estore/es/about` to `tore/es/about` instead of `/estore/about`. The same mismatch affected the `Location` header returned for default-locale-prefixed URLs under `prefix-other-locales` (e.g. `base: '/entry'`), and `getAbsoluteLocaleUrl()` for locales mapped to a domain. Only the whole locale segment is now removed or replaced.
