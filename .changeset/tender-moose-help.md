---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Allows specifying font formats when using the experimental Fonts API

Until now, Astro was opinionated about what sources would be kept for usage, mainly keeping `woff2` and `woff` files.

You can now specify what font formats should be downloaded (if available). Only `woff2` files are by default:

```diff
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
    experimental: {
        fonts: [{
            name: 'Roboto',
            cssVariable: '--font-roboto',
            provider: fontProviders.google(),
+            formats: ['woff2', 'otf']
        }]
    }
})
```
