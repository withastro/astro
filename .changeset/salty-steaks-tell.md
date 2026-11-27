---
'astro': patch
---

Fixes the `/_image` endpoint rejecting `f=svg` requests with a 403 when an SVG source URL has no file extension (e.g. `https://skillicons.dev/icons?i=git`). For sources without an extension, the endpoint now checks the loaded image content to determine whether it is an SVG.
