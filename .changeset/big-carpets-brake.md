---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Updates how options are passed to the Google and Google Icons font providers when using the experimental Fonts API

Previously, the Google and Google Icons font providers accepted options that were specific to given font families.

These options must now be set using the `options` property instead. For example using the Google provider:

```diff
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
    experimental: {
        fonts: [{
            name: 'Inter',
            cssVariable: '--astro-font-inter',
            weights: ['300 900'],
-            provider: fontProviders.google({
-                experimental: {
-                    variableAxis: {
-                        Inter: { opsz: ['14..32'] }
-                    }
-                }
-            }),
+            provider: fontProviders.google(),
+            options: {
+                experimental: {
+                    variableAxis: { opsz: ['14..32'] }
+                }
+            }
        }]
    }
})
```