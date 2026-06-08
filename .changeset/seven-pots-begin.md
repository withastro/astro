---
'astro': major
---

Removes the `experimental.advancedRouting` flag and enables advanced routing by default.

`fetchFile` is now a top-level config option instead of being nested under `experimental.advancedRouting`. The default entrypoint is `src/fetch.ts`.

```diff
// astro.config.mjs
export default defineConfig({
-  experimental: {
-    advancedRouting: {
-      fetchFile: 'fetch.ts',
-    },
-  },
+  fetchFile: 'fetch.ts',
})
```

Set `fetchFile: null` to disable the entrypoint.
