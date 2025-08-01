---
'@astrojs/netlify': patch
---

Fixes a bug where the adapter would cause a runtime error when calling `astro build` in CI environments.
