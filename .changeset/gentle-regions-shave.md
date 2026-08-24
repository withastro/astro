---
'astro': patch
'@astrojs/mdx': patch
---

Fixes build errors showing wrong file location, missing line:col, and misleading hints when a plugin error (e.g. from MDX) is wrapped by Vite's build error
