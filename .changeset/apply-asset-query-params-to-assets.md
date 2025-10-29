---
'astro': patch
---

Fixes skew protection support for images and font URLs

Adapter-level query parameters (`assetQueryParams`) are now applied to all image and font asset URLs, including:
- Dynamic optimized images via `/_image` endpoint
- Static optimized image files
- Font preload tags and font requests when using the experimental Fonts API
