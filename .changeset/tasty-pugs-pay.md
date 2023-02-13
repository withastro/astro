---
'@astrojs/image': patch
---

Fix static images for prefetched pages with SSR mode. Images on prefetched pages will now be pulled in their post-processed form from ~/assets, instead of being processed server-side with each request.
