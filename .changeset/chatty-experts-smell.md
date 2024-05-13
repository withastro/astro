---
"astro": minor
---

The CSRF protection check is out of experimental, and its configuration is changed:

```diff
export default defineConfig({
-  experimental: {
-    security: {
-      csrfProtection: {
-        origin: true
-      }
-    }
-  },
+  security: {
+    checkOrigin: true
+  }
})
```
