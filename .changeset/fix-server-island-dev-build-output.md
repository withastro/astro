---
'astro': patch
---

Fixes server islands returning a 500 error in dev mode for adapters that do not set `adapterFeatures.buildOutput` (e.g. `@astrojs/netlify`)
