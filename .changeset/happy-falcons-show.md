---
'@astrojs/cloudflare': patch
'astro': patch
---

Removes the `cssesc` dependency

This CommonJS dependency could sometimes cause complicated issues because Astro is ESM-only. It is now removed in favor of an ESM friendtly implementation
