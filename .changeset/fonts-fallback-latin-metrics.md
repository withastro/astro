---
'astro': patch
---

Fixes optimized font fallbacks being measured on whichever font file the provider returned first, such as a Cyrillic subset or an italic. Fallback metrics now come from the Latin, normal-style file closest to weight 400, so adding subsets or styles no longer changes `size-adjust`.
