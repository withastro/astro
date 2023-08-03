---
'astro': major
---

The property `compressHTML` is now `true` by default. Setting this value to `true` is no longer required.

If you do not want to minify your HTML output, you must set this value to `false` in `astro.config.mjs`.

```diff
import {defineConfig} from "astro/config";
export default defineConfig({
+  compressHTML: false
})
```
