---
'astro': major
---

Removed automatic flattening of `getStaticPaths` result. `.flatMap` and `.flat` should now be used to ensure that you're returning a flat array.
