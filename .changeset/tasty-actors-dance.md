---
"astro": patch
---

Fixes a regression in the `astro:i18n` module, where the functions `getAbsoluteLocaleUrl` and `getAbsoluteLocaleUrlList` returned a URL with double slash with a certain combination of options. 
