---
'@astrojs/sitemap': patch
---

fix: if `serialize` function returns `undefined` for the passed entry, such entry will be excluded from sitemap
