---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Removes the `defineAstroFontProvider()` type helper.

If you are building a custom font provider, remove any occurrence of `defineAstroFontProvider()` and use the `FontProvider` type instead:

```diff
-import { defineAstroFontProvider } from 'astro/config';

-export function myProvider() {
-    return defineAstroFontProvider({
-        entrypoint: new URL('./implementation.js', import.meta.url)
-    });
-};

+import type { FontProvider } from 'astro';

+export function myProvider(): FontProvider {
+    return {
+        entrypoint: new URL('./implementation.js', import.meta.url)
+    },
+}
```