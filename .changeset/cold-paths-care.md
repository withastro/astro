---
'@astrojs/sitemap': patch
---

Fixes the issue with the option `lastmod` where if it is defined it applies correctly to `<url>` entries in each `sitemap-${i}.xml` file but not the `<sitemap>` entries in the root `sitemap-index.xml` file.
