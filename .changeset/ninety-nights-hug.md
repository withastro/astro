---
'astro': patch
---

Fixes a bug where the functions `Astro.preferredLocale` and `Astro.preferredLocaleList` would return the incorrect locales 
when the Astro configuration specifies a list of `codes`. Before, the functions would return the `path`, instead now the functions 
return a list built from `codes`.
