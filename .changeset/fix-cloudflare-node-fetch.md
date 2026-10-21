---
'astro': patch
---

Fixes `astro dev` with `@astrojs/cloudflare` failing with ``Calling `require` for "node-fetch"`` when a server dependency such as `cross-fetch` requires `node-fetch`
