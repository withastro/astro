---
'astro': patch
---

Fixes a bug in the rewrite logic, where Astro didn't correctly rewrite to website with `base`.

If you use the `rewrite()` function on a project that has `base` configured, you must now prepend the base to your existing rewrite URL:

```js
// astro.config.mjs
export default defineConfig({
  base: '/blog'
})
```

```diff
// src/middleware.js
export function onRequest(ctx, next) {
-  return ctx.rewrite("/about")
+  return ctx.rewrite("/blog/about")
}
```
