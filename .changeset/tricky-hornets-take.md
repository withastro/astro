---
'@astrojs/cloudflare': patch
---

Fixes dep scanning failure when `.astro` frontmatter contains regex literals with quote characters (e.g. `/"/g`)
