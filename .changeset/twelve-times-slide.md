---
'astro': minor
---

Adds an experimental flag `svgOptimizer` that enables automatic optimization of your SVG components using the provided optimizer. This supersedes the `svgo` experimental flag, which is now removed.

When enabled, your imported SVG files used as components will be optimized for smaller file sizes and better performance while maintaining visual quality. This can significantly reduce the size of your SVG assets by removing unnecessary metadata, comments, and redundant code.

Astro ships with a [SVGO](https://svgo.dev/) based optimizer, but any can be used.

To enable this feature, add the experimental flag in your Astro config and remove `svgo` if it was enabled:


```diff
// astro.config.mjs
-import { defineConfig } from "astro/config";
+import { defineConfig, svgoOptimizer } from "astro/config";

export default defineConfig({
+  experimental: {
+    svgOptimizer: svgoOptimizer()
-    svgo: true   
+  }
});
```

For more information on enabling and using this feature in your project, see the [experimental SVG optimization docs](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/).
