---
'astro': major
---

Enables advanced routing by default.

The advanced routing feature introduced behind a flag in [v6.3.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#630) is no longer experimental and is now enabled by default.

This gives full control over how requests flow through your application, with first-class support for frameworks like Hono.

Advanced routing now uses `src/fetch.ts` as default entrypoint instead of `src/app.ts`.

If you were previously using this feature without a custom entrypoint, please configure `fetchFile` or rename your entrypoint to `src/fetch.ts`, and then remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental {
-    advancedRouting: true,
  },
+  fetchFile: 'app.ts' // optional, you only need this if you cannot rename your entrypoint.
});
```

`fetchFile` is now a top-level config option instead of being nested under `experimental.advancedRouting`. If you were using a custom entrypoint, please update your Astro config to move its configuration:

```diff
// astro.config.mjs
export default defineConfig({
-  experimental: {
-    advancedRouting: {
-      fetchFile: 'my-custom-entrypoint.ts',
-    },
-  },
+  fetchFile: 'my-custom-entrypoint.ts',
})
```

You can also set `fetchFile: null` to disable the entrypoint if you are using `src/fetch.ts` for another purpose, or don’t need advanced routing features.

If you have been waiting for stabilization before using advanced routing, you can now do so.

Please see [the advanced routing guide in docs](https://docs.astro.build/en/guides/routing/#advanced-routing) for more about this feature.
