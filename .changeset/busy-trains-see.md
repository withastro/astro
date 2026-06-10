---
'astro': patch
---

Fixes an issue where renaming an image file while the dev server is running triggers a build error. Now Astro correctly hot-reloads the image without crashing.
