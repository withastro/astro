---
'@astrojs/netlify': minor
'@astrojs/vercel': minor
'@astrojs/node': minor
'astro': minor
---

Stabilizes the adapter feature `experimentalStatiHeaders`. If you were using this  feature in any of the supported adapters, you'll need to change the name of the flag:

```diff
export default defineConfig({
  adapter: netlify({
-    experimentalStaticHeaders: true
+    staticHeaders: true
  })
})
```
