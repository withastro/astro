---
'@astrojs/db': patch
---

Fixes `astro build --remote` failing with `Invalid URL string.` when using `@astrojs/db` with `@astrojs/cloudflare`

The `@astrojs/db` integration creates a temporary Vite dev server during builds for seed file execution. This server was inheriting the full build Vite config including `@cloudflare/vite-plugin`, which created a workerd-based SSR environment that eagerly imported the manifest module before it was ready. The fix filters out Cloudflare's Vite plugins from the temp server since it only needs a standard Node.js SSR environment.
