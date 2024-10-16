---
'astro': minor
---

Makes `defineConfig` generic

TypeScript will now provide feedback at the type level when using `defineConfig`. For example, it will make sure `i18n.locales` contains `i18n.defaultLocale`.

This also makes the `AstroUserConfig` generic, but both changes are backward compatible.
