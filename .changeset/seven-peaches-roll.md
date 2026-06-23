---
'astro': patch
---

Fixes responsive image CSS overriding user styles defined inside CSS `@layer` blocks. The generated image styles are now wrapped in `@layer astro.images`, ensuring they have lower cascade priority than user-defined layers.
