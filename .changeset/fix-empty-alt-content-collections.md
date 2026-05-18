---
'astro': patch
---

Fixes markdown images with empty alt text (`![](image.jpg)`) in content collections dropping the `alt` attribute entirely. The `alt=""` attribute is now correctly preserved in the rendered HTML output, which is important for accessibility (indicating decorative images).
