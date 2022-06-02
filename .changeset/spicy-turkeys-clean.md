---
'astro': patch
'@astrojs/deno': patch
'@astrojs/netlify': patch
---

Alias `from 'astro'` imports to `'@astro/types'`
Update Deno and Netlify integrations to handle vite.resolves.alias as an array
