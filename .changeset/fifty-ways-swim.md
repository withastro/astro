---
'astro': patch
---

Improves build performance by removing an unfiltered transform hook from the `astro:head-metadata-build` plugin. Head propagation modules are now identified by their module ID (`?astroPropagatedAssets`) instead of scanning every module's source code.
