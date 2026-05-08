---
'astro': patch
'@astrojs/cloudflare': patch
---

Fixes a bug where Cloudflare prerender errors (e.g. using `node:crypto` without `nodejs_compat`) silently produced 0-byte output files instead of failing the build
