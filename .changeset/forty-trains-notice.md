---
'astro': minor
---

Improves `defineConfig` type safety. TypeScript will now error if a group of related options do not have coherent types. For example, it will now error if `i18n.defaultLocale` is not one of the locales specified in `i18n.locales`
