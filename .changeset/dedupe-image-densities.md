---
'astro': patch
---

Fixes `<Image>` and `<Picture>` emitting duplicate `srcset` candidates when `densities` contains equivalent values such as `1` and `'1x'`
