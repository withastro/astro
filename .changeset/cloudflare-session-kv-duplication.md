---
'@astrojs/cloudflare': patch
---

Fixes user-declared KV namespace bindings being duplicated in the generated `dist/server/wrangler.json`, which caused wrangler validation to fail with "<binding> assigned to multiple KV Namespace bindings." The Astro Cloudflare config customizer now returns only the auto-injected `SESSION` binding and lets `@cloudflare/vite-plugin` merge it with the user's wrangler config, instead of pre-merging the user's bindings into the output.
