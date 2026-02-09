---
'@astrojs/cloudflare': patch
---

Fixes server-side dependencies not being discovered ahead of time during dev. Previously, imports in `.astro` file frontmatter were not scanned by Vite's dependency optimizer, causing a "new dependencies optimized" message and page reload when the dependency was first encountered. This adds an esbuild plugin that extracts frontmatter from `.astro` files during the optimization scan phase.
