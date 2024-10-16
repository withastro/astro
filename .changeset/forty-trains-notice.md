---
'astro': minor
---

Makes `defineConfig` generic

TypeScript will now provide feedback at the type level when using `defineConfig`. For example, it will make sure `i18n.defaultLocale` is one of the locales declared in `i18n.locales`
