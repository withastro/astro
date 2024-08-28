---
'astro': patch
---

Fixes a bug in the logic of `Astro.rewrite()` which led to the value for `base`, if configured, being automatically prepended to the rewrite URL passed. This was unintended behavior and has been corrected, and Astro now processes the URLs exactly as passed.

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
