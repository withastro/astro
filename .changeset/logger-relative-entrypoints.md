---
'astro': minor
---

Adds support for specifying relative `logger.entrypoint` string paths instead of using URLs:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  logger: {
-    entrypoint: new URL('./src/logger.js', import.meta.url),
+    entrypoint: './src/logger.js',
  },
});
```
