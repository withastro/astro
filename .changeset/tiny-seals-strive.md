---
'@astrojs/vercel': patch
---

Fixes the immutable `Cache-Control` rule for hashed assets (`/_astro/*`) being emitted after the `filesystem` route handle in `.vercel/output/config.json`.
