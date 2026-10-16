---
'astro': patch
---

Fixes the `defineConfig()` types for `i18n.defaultLocale`, `i18n.fallback`, and `i18n.domains` so they accept a custom locale's `path` instead of its `codes`, matching how Astro validates and uses these values
