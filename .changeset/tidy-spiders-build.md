---
'astro': minor
---

Astro now treats Vite's resolved `outDir` values as the source of truth for build output. Generated assets, build hook `dir` values, and SSR manifest paths use the resolved client, server, and prerender directories. Custom prerenderer factories also receive these directories through a new context argument.
