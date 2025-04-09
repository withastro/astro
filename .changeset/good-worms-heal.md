---
'astro': patch
---

Deprecates the asset utility function `emitESMImage()` and adds a new `emitImageMetadata()` to be used instead

The function `emitESMImage()` is now deprecated. It will continue to function, but it is no longer recommended nor supported. This function will be completely removed in a next major release of Astro. 

Please replace it with the new function`emitImageMetadata()` as soon as you are able to do so:

```diff
- import {emitESMImage} from "astro/assets/utils";
+ import {emitImageMetadata} from "astro/assets/utils";
```

The new function was created to operate the same way as the old function, and should work interchangeably in your code. However, its signature is not identical and you may need to check that your code is working as intended.
