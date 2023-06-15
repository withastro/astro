---
'@astrojs/tailwind': major
---

Rename options `config.path` to `configFile`, and `config.applyBaseStyles` to `applyBaseStyles`. If you are using these options, you need to migrate to the new names.

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({
-      config: {
-        path: '...',
-        applyBaseStyles: true,
-      },
+      configFile: '...',
+      applyBaseStyles: true,
    }),
  ],
});
```
