---
'astro': minor
---

The `experimental.rewriting` feature introduced behind a flag in [v4.8.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#480) is no longer experimental and is available for general use.

`Astro.rewrite()` and `context.rewrite()` allow you to render a different page without changing the URL in the browser. Unlike using a redirect, your visitor is kept on the original page they visited.

Rewrites can be useful for showing the same content at multiple paths (e.g. /products/shoes/men/ and /products/men/shoes/) without needing to maintain two identical source files.

Rewrites are supported in Astro pages, endpoints, and middleware.

Return `Astro.rewrite()` in the frontmatter of a `.astro` page component to display a different page's content, such as fallback localized content:

```astro
---
---
// src/pages/es-cu/articles/introduction.astro
return Astro.rewrite("/es/articles/introduction")
---
}
---
```

Use `context.rewrite()` in endpoints, for example to reroute to a different page:

```js
// src/pages/api.js
export function GET(context) {
  if (!context.locals.allowed) {
    return context.rewrite('/');
  }
}
```

The middleware `next()` function now accepts a parameter with the same type as the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

```js
// src/middleware.js
export function onRequest(context, next) {
  if (!context.cookies.get('allowed')) {
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

Please see [the routing guide in docs](https://docs.astro.build/en/guides/routing/#rewrites) for more about using this feature.


