---
'@astrojs/internal-helpers': patch
'astro': patch
---

Fixes the image endpoint treating directories whose names differ only by letter case as being inside the build output directory on case-sensitive filesystems
