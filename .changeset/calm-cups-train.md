---
'astro': patch
---

Fixes client hydration for components imported through Node.js subpath imports (`package.json#imports`, e.g. `#components/*`) when using the Cloudflare adapter in development.
