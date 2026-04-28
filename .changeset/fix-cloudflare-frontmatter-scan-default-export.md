---
'@astrojs/cloudflare': patch
---

Fixes `astro-frontmatter-scan` to always provide a default export during dep scanning so `.ts` files that default-import `.astro` components do not fail with missing default export errors
