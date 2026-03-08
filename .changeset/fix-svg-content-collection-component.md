---
'astro': patch
---

Fix regression where SVG images in content collection `image()` fields could not be rendered as inline components. This behavior is now restored while preserving the TLA deadlock fix.
