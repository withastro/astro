---
'astro': patch
---

Emit the `before-hydration` script chunk for the `client` Vite environment. The chunk was only emitted for `prerender` and `ssr` environments, causing a 404 when browsers tried to load it. This broke hydration for any integration using `injectScript('before-hydration', ...)`, including Lit SSR.
