---
'astro': patch
---

Replaces internal CSS chunking behavior for Astro components' scoped styles to use Vite's `cssScopeTo` feature. The feature is a port of Astro's implementation so this should not change the behavior.
