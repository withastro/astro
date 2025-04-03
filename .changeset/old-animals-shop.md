---
'astro': patch
---

Fixes an issue where Astro validate the i18n options incorrectly, causing false positives to downstream libraries. Now Astro emits an error when `i18n.routing.prefixDefaultLocale` is `false` and `i18n.routing.redirectToDefaultLocale` is set to `true`.
