---
'@astrojs/internal-helpers': patch
---

Fixes incremental build cache invalidation caused by Shiki mutating the `langAlias` config object when loading languages
