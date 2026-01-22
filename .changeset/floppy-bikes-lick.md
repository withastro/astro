---
'astro': patch
---

Exposes `root` on `FontProvider` `init()` context

When building a `FontProvider` for the experimental Fonts API, the `init()` method receives a `context`. This context now exposes a `root` URL, useful for resolving local files:

```diff
import type { FontProvider } from "astro";

export function registryFontProvider(): FontProvider {
  return {
    // ...
-    init: async ({ storage }) => {
+    init: async ({ storage, root }) => {
        // ...
    },
  };
}
```
