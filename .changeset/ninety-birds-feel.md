---
'@astrojs/markdoc': patch
---

Fixes imports that use TypeScript `paths` aliases (e.g. `~/markdoc/nodes.js`) in `markdoc.config.*` failing with "Cannot find package"
