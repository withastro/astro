---
'@astrojs/cloudflare': patch
---

Fixes `Cannot find package 'prismjs'` errors when `prismjs` isn't hoisted, such as with pnpm's global virtual store or `hoist=false`
