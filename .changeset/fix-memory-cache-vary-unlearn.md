---
'astro': patch
---

Fixes the memory cache provider routing requests to a stale Vary-based cache key after a path's response stopped sending the `Vary` header, so every request re-rendered while responses stayed Vary-free. The provider now un-learns previously seen `Vary` headers when a cached or revalidated response no longer includes them.
