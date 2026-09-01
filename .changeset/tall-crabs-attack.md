---
'astro': patch
---

Fixes i18n fallback routes being generated with a corrupted path when the locale code also appears at the start of a later path segment. A page such as `src/pages/en/enterprise.astro` with `fallback: { es: 'en' }` produced the route `/es/esterprise` instead of `/es/enterprise`, so the fallback never matched the intended URL. Only the leading locale segment is rewritten now.
