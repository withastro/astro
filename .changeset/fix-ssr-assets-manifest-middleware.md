---
'astro': patch
---

Fixes catch-all routes incorrectly intercepting requests for static assets when using the `@astrojs/node` adapter in middleware mode.
