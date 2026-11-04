---
'astro': patch
---

Fixes the dev toolbar audit freezing CSS animations of SVGs shown through `<img>` in Safari. The audit now reads image sizes from the browser's Resource Timing data instead of fetching each image again.
