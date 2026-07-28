---
'astro': minor
---

Adds support for paths relative to your project root in `logger.entrypoint`

Previously, pointing `logger.entrypoint` at a custom log handler living in your own project required building an absolute `URL`. You can now write the path directly:

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

Paths starting with `./` or `../` are resolved against your project root. Package specifiers such as `@org/astro-logger`, absolute paths, and `URL` entrypoints keep working as before.
