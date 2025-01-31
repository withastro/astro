---
'astro': patch
---

Fixes a bug where the i18n middleware was blocking a server island request when the `prefixDefaultLocale` option is set to `true`
