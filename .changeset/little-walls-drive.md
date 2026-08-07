---
'astro': patch
---

Fixes incremental builds dropping optimized images for cached pages when using a `collectStaticImages` prerenderer (e.g. `@astrojs/cloudflare` with compile-time image optimization)
