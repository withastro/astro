---
'astro': major
'@astrojs/netlify': minor
---

The configuration `build.split` and `build.excludeMiddleware` are deprecated.

Configuration that were inside the astro configuration, are now moved inside the adapter:

```diff
import {defineConfig} from "astro/config";
import netlify from "@astrojs/netlify/functions";

export default defineConfig({
-    build: {
-        excludeMiddleware: true
-    },
-    adapter: netlify()
+    adapter: netlify({
+        edgeMiddleware: true
+    })
})
```

```diff
import {defineConfig} from "astro/config";
import netlify from "@astrojs/netlify/functions";

export default defineConfig({
-    build: {
-        split: true
-    },
-    adapter: netlify()
+    adapter: netlify({
+        functionPerRoute: true
+    })
})
```

