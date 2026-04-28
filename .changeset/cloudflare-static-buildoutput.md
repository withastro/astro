---
'@astrojs/cloudflare': patch
---

Adds `preserveBuildServerDir` to the Cloudflare adapter's features, ensuring `dist/server/` and `dist/client/` directory structure is maintained for all build types. This fixes issues where static Cloudflare builds with server islands or image endpoints would fail at preview time due to mismatched output directories.
