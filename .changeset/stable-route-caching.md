---
'astro': minor
---

Stabilizes route caching, removing the `experimental.cache` and `experimental.routeRules` flags and replacing them with the top-level `cache` and `routeRules` configuration options.

Route caching, introduced experimentally in v6.0.0, is now stable. It gives you a platform-agnostic way to cache responses from [on-demand rendered](https://docs.astro.build/en/guides/on-demand-rendering/) pages and endpoints, based on standard HTTP caching semantics.

Update your config to move `cache` and `routeRules` out of the `experimental` block:

```diff
// astro.config.mjs
import { defineConfig, memoryCache } from 'astro/config';

export default defineConfig({
-  experimental: {
-    cache: {
-      provider: memoryCache(),
-    },
-    routeRules: {
-      '/blog/[...path]': { maxAge: 300, swr: 60 },
-    },
-  },
+  cache: {
+    provider: memoryCache(),
+  },
+  routeRules: {
+    '/blog/[...path]': { maxAge: 300, swr: 60 },
+  },
});
```

Set caching directives in your routes with `Astro.cache` (in `.astro` pages) or `context.cache` (in API routes and middleware), and Astro translates them into the appropriate headers or runtime behavior depending on your configured cache provider. You can also define cache rules for routes declaratively in your config using `routeRules`, without modifying route code.

See the [route caching guide](https://docs.astro.build/en/guides/caching/) for more information.
