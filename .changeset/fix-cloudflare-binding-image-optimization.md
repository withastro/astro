---
'@astrojs/cloudflare': patch
---

Fixes image optimization for prerendered pages when using the default `cloudflare-binding` image service. During the build, the Cloudflare IMAGES binding is now used to transform static images in the workerd prerender environment, and the optimized bytes are written directly to the output directory. Falls back to Sharp if the binding is unavailable.
