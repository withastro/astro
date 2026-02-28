---
'astro': patch
---

Fixes server islands returning a 500 error in dev mode for adapters that do not set `adapterFeatures.buildOutput` (e.g. `@astrojs/netlify`)

The `/_server-islands/[name]` endpoint was incorrectly requiring `getStaticPaths()` because `settings.buildOutput` was being reset to `'static'` after the adapter had already set it to `'server'`.
