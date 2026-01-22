---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Updates how the local provider must be used when using the experimental Fonts API

Previously, there were 2 kinds of font providers: remote and local.

Font providers are now unified. If you are using the local provider, here is how you can update:

```diff
-import { defineConfig } from "astro/config";
+import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
    experimental: {
        fonts: [{
            name: "Custom",
            cssVariable: "--font-custom",
-            provider: "local",
+            provider: fontProviders.local(),
+            options: {
            variants: [
                {
                    weight: 400,
                    style: "normal",
                    src: ["./src/assets/fonts/custom-400.woff2"]
                },
                {
                    weight: 700,
                    style: "normal",
                    src: ["./src/assets/fonts/custom-700.woff2"]
                }
                // ...
            ]
+            }
        }]
    }
});
```
