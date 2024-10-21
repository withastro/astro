---
'astro': minor
---

Improves `defineConfig` type safety. TypeScript will now error if a group of related configuration options do not have consistent types. For example, you will now see an error if your language set for `i18n.defaultLocale` is not one of the supported locales specified in `i18n.locales`.
