---
'astro': major
'@astrojs/vercel': minor
---

The configuration `build.split` and `build.excludeMiddleware` are deprecated.

Configuration that were inside the astro configuration, are now moved inside the adapter:

```diff
import {defineConfig} from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
-    build: {
-        excludeMiddleware: true
-    },
-    adapter: vercel()
+    adapter: vercel({
+        edgeMiddleware: true
+    })
})
```

```diff
import {defineConfig} from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
-    build: {
-        split: true
-    },
-    adapter: vercel()
+    adapter: vercel({
+        functionPerRoute: true
+    })
})
```

