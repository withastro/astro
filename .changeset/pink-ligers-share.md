---
"astro": minor
---

Add experimental rewriting in Astro, via `rewrite()` function and `next()` function.

The feature is available via experimental flag:

```js
export default defineConfig({
  experimental: {
    rewriting: true
  }
})
```

When enabled, you can use `rewrite()` to **render
** another page without changing the URL of the browser in Astro pages and endpoints.

```astro
---
// src/pages/dashboard.astro
if (!Astro.props.allowed) {
	return Astro.rewrite("/")
}
---
```

```js
// src/pages/api.js
export function GET(ctx) {
  if (!ctx.locals.allowed) {
    return ctx.rewrite("/")
  }
}
```

The middleware `next()` function now accepts the same payload of the `rewrite()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

```js
// src/middleware.js
export function onRequest(ctx, next) {
  if (!ctx.cookies.get("allowed")) {
    return next("/") // new signature
  }
  return next();
}
```

> **NOTE
**: please [read the RFC](https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md) to understand the current expectations of the new APIs.
