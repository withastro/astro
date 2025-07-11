---
'astro': patch
---

Fixes an issue where `getImage()` assigned the resized base URL to the srcset URL of `ImageTransform`, which matched the width, height, and format of the original image.
