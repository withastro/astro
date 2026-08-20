---
'@astrojs/vercel': patch
---

Fixes a bug where `@vercel/nft` file tracing silently dropped all dependency files when `outDir` was configured outside `root`, causing deployed functions to crash with `ERR_MODULE_NOT_FOUND`
