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
-      driver: 'upstash',
-    },
+    session: true,
  },
+  session: {
+    driver: 'upstash',
+  }, 
});
```

You no longer need to configure a session driver if you are using an adapter that supports automatic session driver configuration and wish to use its default settings.

```diff
defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
-    session: {
-      driver: 'fs',
-      cookie: 'astro-cookie',
-    },
+    session: true,
  },
+  session: {
+    cookie: 'astro-cookie',
+  }, 
});
```

However, you can still manually configure additional driver options or choose a non-default driver to use with your adapter with the new top-level `session` config option. For more information, see the [experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/).
