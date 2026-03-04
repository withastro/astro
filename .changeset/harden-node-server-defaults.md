---
'astro': patch
'@astrojs/node': patch
---

Hardens Node adapter HTTP server with improved default timeouts and adds a configurable `bodySizeLimit` option (default 1GB) to limit request body sizes
