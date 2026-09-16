---
'@astrojs/language-server': minor
'astro-vscode': minor
---

Improves type checking and editor support for `.astro` files.

The language server now uses our all-new Biome powered `astro2tsx` implementation. This new version has much better support for incomplete syntax, generic types and various edge cases. 

In the vast majority of cases, no changes should be required to your code, and any change should be the result of more accurate types or behavior.
