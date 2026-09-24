---
'astro': patch
---

Fixes the `/_image` endpoint rejecting `f=svg` requests for SVG sources whose URL has no `.svg` extension, such as extensionless remote icons, in dev and with the `@astrojs/node` adapter. The endpoint now checks the image service's output bytes instead of the source URL, which also stops a raster file behind a `.svg` name from being served as `image/svg+xml`.
