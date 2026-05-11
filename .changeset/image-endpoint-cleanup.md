---
'astro': patch
'@astrojs/internal-helpers': patch
---

Tightens `isRemotePath()` to reject control characters after a leading slash and fixes the dev image endpoint origin check
