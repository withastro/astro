---
'astro': patch
---

Fixes a leak of server runtime code when importing SVGs in client-side code. Previously, when importing an SVG file in client code, Astro could end up adding code for rendering SVGs on the server to the client bundle.
