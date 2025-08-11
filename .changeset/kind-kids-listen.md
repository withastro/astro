---
'astro': minor
---

Adds an experimental flag `staticImportMetaEnv` to disable replacement of `import.meta.env` values with `process.env` calls and their coercion, and supersedes the `rawEnvValues` experimental flag

Astro allows you to configure a [type-safe schema for your environment variables](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables), and converts variables imported via `astro:env` into the expected type.

However, Astro by default turns non public `import.meta.env` values into `process.env` calls during the build, if the environment variable name is present in `process.env`. It also converts your environment variables used through `import.meta.env` in some cases, and this can prevent access to some values such as the strings `"true"` (which is converted to a boolean value), and `"1"` (which is converted to a number).

The `experimental.staticImportMetaEnv` flag disables this behavior, ensuring that `import.meta.env` values are always inlined.

To enable this feature, add the experimental flag in your Astro config:

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
+  experimental: {
+    staticImportMetaEnv: true,
+  }
})
```

This experimental flag supersedes the `experimental.rawEnvValues` flag, that you need to remove in your Astro config:

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
   experimental: {
-    rawEnvValues: true,
+    staticImportMetaEnv: true,
   }
})
```