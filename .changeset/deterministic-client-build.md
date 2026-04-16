---
'astro': patch
---

Fixes non-deterministic client build output by sorting entry points before passing them to Rollup. Previously, consecutive builds of the same source code could produce different output filenames, breaking CDN caching.
