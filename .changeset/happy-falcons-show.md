---
'@astrojs/cloudflare': patch
'astro': patch
---

Removes the `cssesc` dependency

This CommonJS dependency could sometimes cause errors because Astro is ESM-only. It is now replaced with a built-in ESM-friendly implementation.
