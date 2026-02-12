---
'@astrojs/cloudflare': patch
---

Fixes server-side dependencies not being discovered ahead of time during development

Previously, imports in `.astro` file frontmatter were not scanned by Vite's dependency optimizer, causing a "new dependencies optimized" message and page reload when the dependency was first encountered. Astro is now able to scan these dependencies ahead of time.
