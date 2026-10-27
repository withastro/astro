---
'@astrojs/vercel': patch
---

Fix redirects never matching on Vercel when `trailingSlash: 'always'` is set. Redirect sources now include the trailing slash so they match the normalized request path. Sources whose last segment contains a dot are left unslashed, and dynamic or spread sources emit both the slashed and unslashed form, because Vercel only normalizes paths without a dot.
