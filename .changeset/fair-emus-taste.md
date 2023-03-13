---
'@astrojs/cloudflare': patch
---

Remove false-positive warnings from Cloudflare's build.

Cloudflare includes warnings when it bundles the already-built output from astro.build. Those warnings are mostly due to `"sideEffects": false` packages that are included in the Vite built output because they are marked as external. Rollup will remove unused imports from these packages but will not remove the actual import, causing the false-positive warning.
