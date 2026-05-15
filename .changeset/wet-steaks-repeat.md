---
'astro': patch
---

Fixes an issue where SVG images with `width="0"` or `height="0"` incorrectly threw a `NoImageMetadata` error instead of being treated as valid dimensions.
