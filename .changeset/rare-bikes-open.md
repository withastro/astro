---
'astro': patch
---

Fixes `Astro.currentLocale` returning the default locale instead of the domain's locale on dynamic routes served from a mapped domain.
