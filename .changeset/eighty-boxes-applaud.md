---
'astro': major
---

Makes `astro:env` stable

To upgrade, update your Astro config:

```diff
import { defineConfig, envField } from 'astro/config'

export default defineConfig({
-  experimental: {
    env: {
      schema: {
        FOO: envField.string({ /* ... */ })
      }
    }
-  }
})
```