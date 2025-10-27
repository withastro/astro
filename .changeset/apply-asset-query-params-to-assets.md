---
'astro': patch
---

Fix: Apply `assetQueryParams` to image and font URLs

Adapter-level query parameters (`assetQueryParams`) are now applied to all image and font asset URLs, including:
- Dynamic optimized images via `/_image` endpoint
- Static optimized image files
- Font preload tags and font requests

This ensures deployment tracking and cache busting features (like Vercel's skew protection) work correctly for all asset types, not just scripts and stylesheets.
