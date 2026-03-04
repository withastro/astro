---
'astro': patch
---

Hardens the server islands POST endpoint to enforce body size limits using the new `security.serverIslandBodySizeLimit` configuration option (defaults to 1 MB)
