---
'astro': patch
'@astrojs/cloudflare': patch
---

Fixes `astro preview --open` not opening a browser when using an adapter with a custom preview entrypoint, such as `@astrojs/cloudflare`
