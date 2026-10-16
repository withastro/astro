---
'@astrojs/vercel': patch
---

Fixes a bug where redirects configured in `astro.config.mjs` never fired on Vercel when `trailingSlash: 'always'` was set, causing requests to the redirect source to return 404. Redirect sources are now generated to match the trailing-slash-normalized request path.