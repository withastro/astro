---
'astro': patch
---

Fixes `experimental.incrementalBuild` re-rendering unchanged routes that import more than one asset. The route's dependency hash depended on the order the assets finished building, so two builds of identical sources could produce different hashes. The hash is now based on the file name each asset resolves to.
