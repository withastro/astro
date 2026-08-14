---
'@astrojs/cloudflare': patch
---

Fixes the dependency scan failing with `Top-level return cannot be used inside an ECMAScript module` when `.astro` frontmatter contains a regex literal with a quote character in it
