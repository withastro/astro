---
'astro': patch
---

Updates internal CSS chunking behavior for Astro components' scoped styles. This may result in slightly more CSS chunks created, but should allow the scoped styles to only be included on pages that use them.
