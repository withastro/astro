---
'@astrojs/node': patch
'astro': patch
---

Use a Node-specific image endpoint to resolve images in dev and Node SSR. This should fix many issues related to getting 404 from the \_image endpoint under certain configurations
