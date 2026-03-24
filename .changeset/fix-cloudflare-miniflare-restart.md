---
'astro': patch
---

Fixes `Expected 'miniflare' to be defined` errors in dev mode when using the Cloudflare adapter with features that trigger server restarts, such as the Fonts API or config file changes.
