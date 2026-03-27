---
'astro': patch
---

Fixes `Expected 'miniflare' to be defined` errors and 404 responses in dev mode when using the Cloudflare adapter and the config file changes. Instead of creating a brand new Vite server on config changes, Astro now performs a Vite in-place restart, allowing the Cloudflare adapter to reuse its existing miniflare instance across restarts.
