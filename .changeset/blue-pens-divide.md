---
'astro': patch
---

Fixes a bug in the rewrite logic, where Astro didn't correctly rewrite to website with `base`.

This means that if you used the `rewrite` function on a project that has `base`, you need to include it when using a rewrite:

```js
// astro.config.mjs
export default defineConfig({
  base: '/blog'
})
```

```diff
// src/middleware.js
export function onRequest(ctx, next) {
-  return ctx.rerwrite("/about")
+  return ctx.rerwrite("/blog/about")
}
```
