---
'@astrojs/cloudflare': patch
---

Fixes remote images without a file extension failing with `400 Unsupported format: null` when using the `cloudflare-binding` image service

Astro only adds the `f` (format) parameter to `/_image` URLs when it can infer a format from the source, and otherwise leaves it off so the image service resolves the format from the source itself. Extensionless remote images, such as GitHub avatars like `https://avatars.githubusercontent.com/u/1234`, take that path. The image transform endpoint now falls back to the source's media type when `f` is absent, passing SVG sources through unchanged and encoding everything else as WebP. This also fixes SVG images, which are requested as `f=svg` and previously failed the same way.
