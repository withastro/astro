---
"@astrojs/vercel": patch
---

Fixes `widths` and `densities` not working when using Vercel's Image Optimization.

Note that you still need to make sure that the widths you're outputting are enabled in [the `imageConfig` property of the Vercel adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/#imagesconfig) in order for these properties to work.
