---
'astro': patch
---

Fixes an issue where Astro validated the i18n configuration incorrectly, causing false positives in downstream libraries. Astro now only emits this error when both `i18n.routing.prefixDefaultLocale` is `false` and `i18n.routing.redirectToDefaultLocale` is `true`.
