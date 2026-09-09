---
'@astrojs/cloudflare': patch
---

Pre-bundles the default console logger during dev so it is included in the initial optimization pass, preventing a mid-request re-optimization that could crash the dev server on Cloudflare (workerd).