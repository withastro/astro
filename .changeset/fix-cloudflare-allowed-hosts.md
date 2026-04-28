---
'astro': minor
'@astrojs/cloudflare': minor
---

Ensures that `server.allowedHosts` (and `vite.preview.allowedHosts`) configuration is respected when using `astro preview` with the `@astrojs/cloudflare` adapter. This improves security by preventing DNS rebinding attacks when previewing Cloudflare builds locally.
