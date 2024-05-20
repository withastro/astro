---
"astro": minor
---

The CSRF protection feature that was introduced behind a flag in [v4.6.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#460) is no longer experimental and is available for general use. 

To enable the stable version, add the new top-level `security` option in `astro.config.mjs`. If you were previously using the experimental version of this feature, also delete the experimental flag:

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

Enabling this setting performs a check that the `"origin"` header, automatically passed by all modern browsers, matches the URL sent by each Request.

This check is executed only for pages rendered on demand, and only for the requests `POST`, `PATCH`, `DELETE` and `PUT` with one of the following `"content-type"` headers: `'application/x-www-form-urlencoded'`, `'multipart/form-data'`, `'text/plain'`.

If the `"origin"` header doesn't match the pathname of the request, Astro will return a 403 status code and won't render the page.

For more information, see the [`security` configuration docs](https://docs.astro.build/en/reference/configuration-reference/#security).
