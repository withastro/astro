---
'@astrojs/cloudflare': patch
---

Forwards the `cacheKey` from `getStaticPaths()` through the prerenderer so that Astro's experimental incremental static builds can skip unchanged pages when deploying to Cloudflare
