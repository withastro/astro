---
'@astrojs/vercel': patch
---

Fix redirects never matching on Vercel when `trailingSlash: 'always'` is set. Redirect sources now include the trailing slash (except the root, spread routes, and file-extension paths) so they match the normalized request path.
