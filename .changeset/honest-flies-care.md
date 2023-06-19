---
'astro': patch
---

fix(astro:assets): inject `/_image` endpoint with prerendered=false on serverLikeOutput

Previously, on hybrid output, images imported on a server-side-rendered page were not rendered and returned a 404 response.
