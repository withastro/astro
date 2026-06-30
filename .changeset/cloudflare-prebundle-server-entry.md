---
'@astrojs/cloudflare': patch
---

Pre-bundles the worker server entrypoint (`@astrojs/cloudflare/entrypoints/server`) during dev startup. Previously it was discovered lazily on the first request, causing Vite to log `✨ new dependencies optimized: @astrojs/cloudflare/entrypoints/server` and trigger a re-optimization. It's now included in `optimizeDeps.include` for the server environment so it's pre-bundled up front.
