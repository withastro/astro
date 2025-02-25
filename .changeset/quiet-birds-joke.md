---
'@astrojs/internal-helpers': minor
---

Add remote URL filtering utilities

Code to filter remote URLs according to a given config is now used by both
`astro` and `@astrojs/markdown-remark`. That logic should be shared between
those packages, so it must live here.
