---
'astro': patch
---

Fixes an issue where prerendered dynamic routes whose `getStaticPaths` parameters contain `%` were skipped during build
