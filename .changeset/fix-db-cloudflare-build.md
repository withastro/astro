---
'@astrojs/db': patch
---

Fixes `astro build --remote` failing with "Invalid URL string" when using `@astrojs/db` with `@astrojs/cloudflare`. The temporary Vite server created during build now filters out Cloudflare's environment-replacing plugins, preventing the workerd runtime from eagerly loading the manifest placeholder.
