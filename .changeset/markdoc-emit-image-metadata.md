---
'@astrojs/markdoc': minor
---

Updates internal image processing to be compatible with Astro 6. This change is internal-only and does not affect the public API.

The integration now uses Astro's new `emitImageMetadata()` function instead of the removed `emitESMImage()` function for processing images referenced in Markdoc content during build time. This ensures continued compatibility with Astro's asset processing pipeline while maintaining the same behavior for users.