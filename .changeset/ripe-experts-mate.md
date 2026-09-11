---
'@astrojs/netlify': patch
---

Fixes skew protection to include the build assets directory (`/_astro/` by default) in `skew-protection.json` patterns, preventing lazy-hydrated islands from loading duplicate framework instances after a redeploy
