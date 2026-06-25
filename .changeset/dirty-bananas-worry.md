---
'astro': patch
---

Fixes a bug where an error thrown inside one route's `getStaticPaths()` would prevent other valid routes from being matched in dev mode
