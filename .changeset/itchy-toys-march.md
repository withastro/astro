---
'astro': major
---

The option `security.checkOrigin` is `true` by default

### Changed: `security.checkOrigin` default value to `true`
In Astro v4.0, the value of `security.checkOrigin` was `false`, and users needed to opt-in.

Astro v5.0, the default value of `security.checkOrigin` is now `true`.
#### What should I do?

Update `astro.config.mjs` to _opt-out_:

```diff
export default defineConfig({
+  security: {
+    checkOrigin: false
+  }
})
```
