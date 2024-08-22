---
'astro': major
---

The `astro:env` feature introduced behind a flag in [v4.10.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#x4100) is no longer experimental and is available for general use.

This feature lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client. Import and use your defined variables from the appropriate `/client` or `/server` module:

```astro
---
import { API_URL } from "astro:env/client"
import { API_SECRET_TOKEN } from "astro:env/server"

const data = await fetch(`${API_URL}/users`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_SECRET_TOKEN}`
  },
})
---

<script>
import { API_URL } from "astro:env/client"

fetch(`${API_URL}/ping`)
</script>
```

If you were previously using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig, envField } from 'astro/config'

export default defineConfig({
-  experimental: {
-    env: {
-      schema: {
-        FOO: envField.string({ /* ... */ })
-      }
-    }
-  }
+  env: {
+    schema: {
+      FOO: envField.string({ /* ... */ })
+    }
+  }
})
```

If you have been waiting for stabilization before using `astro:env`, you can now do so.

Please see [Using environment variables](https://docs.astro.build/en/guides/environment-variables/#astroenv) for more about this feature.
