---
'@astrojs/vercel': patch
'@astrojs/netlify': patch
---

Fixes NFT tracing so dynamic path segments no longer glob the whole workspace, which could include unrelated files in function bundles for monorepo projects
