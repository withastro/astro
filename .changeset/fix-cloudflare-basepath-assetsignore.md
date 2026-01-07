---
'@astrojs/cloudflare': patch
---

Fixes deploy failure when using Astro base path with Cloudflare adapter

When deploying to Cloudflare Workers with a `base` path configured, wrangler would fail with an error about uploading `_worker.js` directory as an asset. The adapter now automatically generates a `.assetsignore` file that excludes `_worker.js` from being treated as a static asset when a base path is configured.
