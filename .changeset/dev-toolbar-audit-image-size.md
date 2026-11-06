---
'astro': patch
---

Fixes the dev toolbar's audit freezing an image's CSS animations in Safari, by reading the image's size from the request that loaded it instead of fetching it again
