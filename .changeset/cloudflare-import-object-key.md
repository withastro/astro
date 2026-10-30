---
'@astrojs/cloudflare': patch
---

Fixes a dev dependency scan error caused by object keys named `import` in frontmatter, such as the `import` option of `import.meta.glob()`
