---
'astro': minor
---

The new rewrite APIs are deemed stable, which means that the experimental flag isn't needed anymore:

```diff
// astro.config.mjs
export default defineConfig({
-  experimental: {
-    rewriting: true
-  }
})
```
