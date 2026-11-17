---
'@astrojs/underscore-redirects': patch
---

Fixes `_redirects` targets for dynamic redirects (e.g. `'/blog/[...slug]': '/articles/[...slug]'`) to use `:splat` for rest parameters and no longer append `index.html` or `.html`, so the rules work on Netlify and Cloudflare
