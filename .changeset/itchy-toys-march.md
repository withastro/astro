---
'astro': major
---

Updates the default value of `security.checkOrigin` to `true`, which enables Cross-Site Request Forgery (CSRF) protection by default for pages rendered on demand.

If you had previously configured `security.checkOrigin: true`, you no longer need this set in your Astro config. This is now the default and it is safe to remove.

To disable this behavior and opt out of automatically checking that the “origin” header matches the URL sent by each request, you must explicitly set `security.checkOrigin: false`:

```diff
export default defineConfig({
+  security: {
+    checkOrigin: false
+  }
})
```
