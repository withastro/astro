---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Changes the font format downloaded by default when using the experimental Fonts API. Additionally, adds a new `formats` configuration option to specify which font formats to download.

Previously, Astro was opinionated about which font sources would be kept for usage, mainly keeping `woff2` and `woff` files.

You can now specify what font formats should be downloaded (if available). Only `woff2` files are downloaded by default.

#### What should I do?

If you were previously relying on Astro downloading the `woff` format, you will now need to specify this explicitly with the new `formats` configuration option. Additionally, you may also specify any additional file formats to download if available:

```diff
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
    experimental: {
        fonts: [{
            name: 'Roboto',
            cssVariable: '--font-roboto',
            provider: fontProviders.google(),
+            formats: ['woff2', 'woff', 'otf']
        }]
    }
})
```
