---
'@astrojs/cloudflare': major
---

The configuration `build.split` and `build.excludeMiddleware` are deprecated.

You can now configure this behavior using `functionPerRoute` in your Cloudflare integration config:

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
