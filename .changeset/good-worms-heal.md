---
'@astrojs/markdoc': patch
'astro': patch
---

The function
`emitESMImage` has been deprecated, and it will be removed in a next major release of Astro. Use the function
`emitImageMetadata` instead.

```diff
- import {emitESMImage} from "astro/assets/utils";
+ import {emitImageMetadata} from "astro/assets/utils";
```
