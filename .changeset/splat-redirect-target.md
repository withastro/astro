---
'@astrojs/underscore-redirects': patch
---

Fixes dynamic redirects in the generated `_redirects` file pointing at the prerendered HTML file with a literal `*`, such as `/team/articles/*/index.html`. A redirect now targets the destination page and writes a spread as `:splat`, which Netlify and Cloudflare substitute. Cloudflare previously rejected these rules as an infinite loop.
