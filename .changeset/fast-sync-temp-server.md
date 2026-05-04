---
"astro": patch
---

Skips adapter `configureServer` hooks and per-environment dependency pre-bundling during the temporary Vite server used by `astro build` for type generation. The temp server only resolves virtual modules — it never serves HTTP requests — so starting adapter runtimes (e.g. miniflare/workerd via `@astrojs/cloudflare`) and pre-bundling adapter `optimizeDeps.include` lists were both unnecessary. On a representative project this reduces the “Types Generated” phase from ~3.6 s to ~125 ms.
