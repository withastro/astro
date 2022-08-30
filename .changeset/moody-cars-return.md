---
'astro': patch
---

Include trailingSlash in astro:build:done hook

This change ensures that the `pages` provided in the `astro:build:done` hook conform to the `trailingSlash` and `build.format` configs.
