---
'@astrojs/cloudflare': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'astro': minor
---

Adds new session driver object shape

For greater flexibility and improved consistency with other Astro code, session drivers are now specified as an object:

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

Specifying the session driver as a string has been deprecated, but will continue to work until this feature is removed completely in a future major version. The object shape is the current recommended and documented way to configure a session driver.
