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

The new function returns the same signature as the previous one, however the new function drops some deprecated arguments that weren't meant to be exposed to users;`_watchMode` and `experimentalSvgEnabled` are removed and you may need to check if your code works as intended. 
