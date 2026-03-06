---
'@astrojs/cloudflare': patch
---

Fixes an issue where `esbuild` would throw a "Top-level return cannot be used inside an ECMAScript module" error during dependency scanning in certain environments.
