---
'@astrojs/sitemap': patch
---

Fixes "Cannot read properties of undefined (reading 'reduce')" error when using sitemap integration with `output: 'server'` mode. The `_routes` variable could be undefined if the `astro:routes:resolved` hook did not fire before `astro:build:done`.
