---
'@astrojs/cloudflare': major
---

The configuration `build.split` and `build.excludeMiddleware` are deprecated.

Configuration that were inside the astro configuration, are now moved inside the adapter:

```diff
import {defineConfig} from "astro/config";
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
-    build: {
-        split: true
-    },
-    adapter: cloudflare()
+    adapter: cloudflare({
+        mode: 'directory',
+        functionPerRoute: true
+    })
})
```
