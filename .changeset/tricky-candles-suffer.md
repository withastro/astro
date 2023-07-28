---
'astro': major
'@astrojs/vercel': minor
---

The `build.split` and `build.excludeMiddleware` configuration options are deprecated and have been replaced by options in the adapter config.

If your config includes the `build.excludeMiddleware` option, replace it with `edgeMiddleware` in your adapter options:

```diff
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
     build: {
-        excludeMiddleware: true
     },
     adapter: vercel({
+        edgeMiddleware: true
     }),
});
```

If your config includes the `build.split` option, replace it with `functionPerRoute` in your adapter options:

```diff
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
     build: {
-        split: true
     },
     adapter: vercel({
+        functionPerRoute: true
     }),
});
```

