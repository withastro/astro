---
'astro': patch
---

Ensure custom prerenderers are always torn down during build, even when `getStaticPaths()` throws.
