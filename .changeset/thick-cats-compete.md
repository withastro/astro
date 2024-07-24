---
'astro': minor
---

---
"astro": minor
---

The `experimental.rewriting` feature introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

`Astro.rewrite()`/`ctw.rewrite()` allows to **render
** another page without changing the URL of the browser in Astro pages and endpoints.

```astro
---
// src/pages/dashboard.astro
if (!Astro.props.allowed) {
  return Astro.rewrite('/');
}
---
```

```js
// src/pages/api.js
export function GET(ctx) {
  if (!ctx.locals.allowed) {
    return ctx.rewrite('/');
  }
}
```

The middleware `next()` function now accepts a parameter with the same type as the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

```js
// src/middleware.js
export function onRequest(ctx, next) {
  if (!ctx.cookies.get('allowed')) {
    return next('/'); // new signature
  }
  return next();
}
```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
// astro.config.mjs
export default defineConfig({
-  experimental: {
-    rewriting: true
-  }
})
```

If you have been waiting for stabilization before using rewrites in Astro, you can now do so.

Please see [the specific page in docs](https://docs.astro.build/en/reference/api-reference/#astrorewrite) for more about this feature.


