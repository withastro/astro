---
'astro': minor
---

Add a new `SvgComponent` type

Until now, getting the type of an SVG component was not really straight forward. You can now directly import the `SVGComponent` from `astro/types` instead:

```diff
-type SvgComponent = typeof import("*.svg")
+import type { SvgComponent } from "astro/types"
```
