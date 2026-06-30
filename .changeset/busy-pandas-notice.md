---
'astro': patch
---

Fixes an error that could occur after the dev server restarts when using an adapter such as `@astrojs/cloudflare`, where a request would fail with a `500` referencing a missing pre-bundled dependency:

```
The file does not exist at "node_modules/.vite/deps_ssr/astro_compiler-runtime.js?v=6419660d" which is in the optimize deps directory. The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
```
