---
'astro': patch
---

Fixes `Astro.currentLocale` returning the default locale for a URL segment that differs from the configured locale only in letter case or in `-` vs `_`
