---
'@astrojs/cloudflare': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'astro': minor
---

Adds new session driver object shape

It is now recommended to specify the session driver as an object:

```diff
-import { defineConfig } from 'astro/config'
+import { defineConfig, sessionDrivers } from 'astro/config'

export default defineConfig({
  session: {
-    driver: 'redis',
-    options: {
-      url: process.env.REDIS_URL
-    },
+    driver: sessionDrivers.redis({
+      url: process.env.REDIS_URL
+    }),
  }
})
```
