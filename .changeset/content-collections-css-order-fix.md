---
'astro': patch
---

Fixes the cascade order between inline styles and external stylesheets not being preserved when a content collection entry's propagated CSS is injected during the build. Both kinds are now kept in a single ordered list instead of being split into separate style/link buckets.
