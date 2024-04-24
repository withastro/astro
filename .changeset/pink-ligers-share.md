---
"astro": minor
---

Add experimental rerouting in Astro, via `reroute()` function and `next()` function. 
 
The feature is available via experimental flag:

```js
export default defineConfig({
  experimental: {
    rerouting: true
  }
})
```

When enabled, you can use `reroute()` to **render** another page without changing the URL of the browser in Astro pages and endpoints.

```astro
---
// src/pages/dashboard.astro
if (!Astro.props.allowed) {
	return Astro.reroute("/")
}
---
```

```js
// src/pages/api.js
export function GET(ctx) {
	if (!ctx.locals.allowed) {
		return ctx.reroute("/")
	}
}
```

The middleware `next()` function now accepts the same payload of the `reroute()` function. For example, with `next("/")`, you can call the next middleware function with a new `Request`.

```js
// src/middleware.js
export function onRequest(ctx, next) {
	if (!ctx.cookies.get("allowed")) {
		return next("/") // new signature
	}
	return next();
}
```

> **NOTE**: please [read the RFC](https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md) to understand the current expectations of the new APIs.
