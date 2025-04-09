---
'astro': patch
---

Deprecates the asset utility function `emitESMImage()` and adds a new `emitImageMetadata()` to be used instead

The function
`emitESMImage()` is now deprecated. It will continue to function, but it is no longer recommended nor supported. This function will be completely removed in a next major release of Astro.

Please replace it with the new function`emitImageMetadata()` as soon as you are able to do so:

```diff
- import { emitESMImage } from "astro/assets/utils";
+ import { emitImageMetadata } from "astro/assets/utils";
```

The new function returns the same signature as the previous one. However, the new function removes two deprecated arguments that were not meant to be exposed for public use: `_watchMode` and `experimentalSvgEnabled`. Since it was possible to access these with the old function, you may need to verify that your code still works as intended with `emitImageMetadata()`.
