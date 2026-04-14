---
'astro': patch
---

Fix server-only `define` globals leaking into client build when integrations conditionally set them based on `build.ssr`.
