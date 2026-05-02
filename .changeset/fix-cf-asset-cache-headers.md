---
'@astrojs/cloudflare': patch
---

Automatically inject `Cache-Control: public, max-age=31536000, immutable` for hashed Astro assets into Cloudflare's `_headers` file at build time. The injection is skipped when `build.assetsPrefix` is set (assets served from a different origin) or when the existing `_headers` already sets `Cache-Control` on a rule that matches the assets path.
