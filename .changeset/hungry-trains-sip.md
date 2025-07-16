---
'astro': minor
---

Adds an experimental flag `rawEnvValues` to disable coercion of `import.meta.env` values that are populated from `process.env`

Astro allows you to configure a [type-safe schema for your environment variables](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables), and converts variables imported via `astro:env` into the expected type.

However, Astro also converts your environment variables used through `import.meta.env` in some cases, and this can prevent access to some values such as the strings `"true"` (which is converted to a boolean value), and `"1"` (which is converted to a number).

The `experimental.rawEnvValues` flag disables coercion of `import.meta.env` values that are populated from `process.env`, allowing you to use the raw value.

To enable this feature, add the experimental flag in your Astro config:


```diff
import { defineConfig } from "astro/config"

export default defineConfig({
+  experimental: {
+    rawEnvValues: true,
+  }
})
```
