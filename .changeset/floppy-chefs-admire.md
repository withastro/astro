---
'@astrojs/cloudflare': patch
---

Fixes `astro dev` OOM crashes for `@astrojs/cloudflare` users on Vite 8 by migrating the frontmatter scan plugin to Rolldown-compatible options.
