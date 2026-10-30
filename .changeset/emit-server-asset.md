---
'astro': minor
---

Adds `emitServerAsset()` to `astro/assets/utils`, for integrations that emit a file for server code to read at runtime. Unlike other assets emitted by the server build, it stays in the server output: it is never moved to the client directory, and is not listed as a static file.
