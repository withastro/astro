---
'astro': minor
---

The Content Layer API introduced behind a flag in [4.14.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#4140) is now stable and ready for use.

The Content Layer API is the next generation of content collections, allowing you to load content from anwhere. For more details, see the [content collections documentation](https://docs.astro.build/en/guides/content-collections/).

If you previously used this feature, you can now remove the `experimental.contentLayer` flag from your Astro config:

```diff
// astro.config.mjs
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    contentLayer: true
-  }
})
```
