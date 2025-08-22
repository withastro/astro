---
'astro': patch
---

**BREAKING CHANGE to experimental CSP only**

Adds support for experimental CSP when using experimental fonts

If you were passing a `font-src` directive via `experimental.csp.directives`, you'll need to use `experimental.csp.fontDirectiveResources` instead:

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
    experimental: {
        csp: {
-            directives: ["font-src 'self'"],
+            fontDirectiveResources: ["'self'"],
        }
    }
})
```
