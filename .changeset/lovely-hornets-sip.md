---
'@astrojs/vercel': patch
---

Remove false-positive warnings from Vercel's build.

Vercel includes warnings when it bundles the already-built output from astro.build. Those warnings are mostly due to `"sideEffects": false` packages that are included in the Vite built output because they are marked as external. Rollup will remove unused imports from these packages but will not remove the actual import, causing the false-positive warning.