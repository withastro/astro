---
'@astrojs/vercel': patch
'@astrojs/netlify': patch
---

Fixes NFT tracing in monorepo projects so runtime-relative paths no longer include files from outside the server output, which could produce oversized functions
