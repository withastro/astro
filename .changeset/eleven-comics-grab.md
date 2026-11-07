---
'astro': patch
---

Fixes `astro build` silently skipping prerendered pages whose `getStaticPaths()` params contain a literal `%` (for example `50%-off`)
