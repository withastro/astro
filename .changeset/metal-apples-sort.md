---
'astro': patch
---

Fixes Cloudflare dev server islands with `prerenderEnvironment: 'node'` by sharing the serialized manifest encryption key across dev environments and routing server island requests through the SSR runtime.
