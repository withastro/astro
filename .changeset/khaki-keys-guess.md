---
'@astrojs/cloudflare': minor
'astro': minor
---

Updates image handling to support redirecting URLs.

Astro now tracks up to 10 redirects for optimized images. The image will be loaded if its final destination matches one of the patterns defined by `image.remotePatterns` or `image.domains`. Otherwise, it will be ignored and an error will be thrown.
