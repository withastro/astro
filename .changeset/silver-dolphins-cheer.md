---
"astro": patch
---

fix: match default locale correctly when it is removed because of `prefixDefaultLocale: false`. Previously, the i18n middleware would match parts of the URL that were not actually a locale.
