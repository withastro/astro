---
'astro': patch
'@astrojs/cloudflare': patch
---

Excludes `astro:*` and `virtual:astro:*` from client optimizeDeps in core. Needed for prefetch users since virtual modules are now in the dependency graph.
