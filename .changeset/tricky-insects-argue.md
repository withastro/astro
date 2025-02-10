---
'astro': patch
---

:warning: **BREAKING CHANGE FOR EXPERIMENTAL SESSIONS ONLY** :warning:

Changes the `experimental.session` option to a boolean flag and moves session config to a top-level value. This change is to allow the new automatic session driver support. You now need to separately enable the `experimental.session` flag, and then configure the session driver using the top-level `session` key if providing manual configuration.

```diff
defineConfig({
  // ...
  experimental: {
-    session: {
-      driver: 'fs',
-    },
+    session: true,
  },
+  session: {
+    driver: 'fs',
+  },
});
```

You do not need to configure the session driver if you are using an adapter that supports automatic session driver configuration. For more information, see the [experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/).
