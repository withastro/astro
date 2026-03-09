---
'astro': patch
---

Fixes integration-injected scripts (e.g. Alpine.js via `injectScript()`) not being loaded in the dev server when using non-runnable environment adapters like `@astrojs/cloudflare`.

