---
'@astrojs/netlify': minor
---

Adds new `middlewareMode` adapter feature and deprecates `edgeMiddleware` option

The `edgeMiddleware` option is now deprecated and will be removed in a future major release, so users should transition to using the new `middlewareMode` feature as soon as possible.

```diff
export default defineConfig({
  adapter: netlify({
-    edgeMiddleware: true
+    middlewareMode: 'edge'
  })
})
```
