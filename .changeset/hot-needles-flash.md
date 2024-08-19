---
'astro': major
'@astrojs/sitemap': minor
---

Removes build.format: 'file'

This removes the config option `build.format: 'file'`. This option would remove directory structures in SSG output and instead make all input pages into directory-less HTML files. The use-case has been superceded by `build.format: 'preserve'`.

```diff
import { defineConfig } from 'astro/config';

export default defineConfig({
  build: {
-    format: 'file'
+    format: 'preserve'
  }
})
```

Note that there is one key difference between `'file'` and `'preserve'`: The `'file'` option would remove directories defined as `about/index.astro`. The `'preserve'` option matches the input structure exactly.
