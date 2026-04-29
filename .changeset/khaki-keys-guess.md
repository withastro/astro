---
'@astrojs/cloudflare': minor
'astro': minor
---

Updates image handling to support redirecting URLs.

If an image is configured to be optimized by having it's URL be covered by either `image.remotePatterns` or `image.domains`, Astro will now manually follow up to 10 redirects and check whether the final destination is also covered by either option. If it is, the image will be loaded, otherwise it will be ignored and an error will be thrown.
