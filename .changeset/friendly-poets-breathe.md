---
'astro': patch
---

Add fast lookups for content collection entries when using `getEntryBySlug()`. This generates a lookup map to ensure O(1) retrieval.
