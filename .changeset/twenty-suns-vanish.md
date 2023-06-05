---
'@astrojs/netlify': minor
---

Support for experimental redirects

This adds support for the redirects RFC in the Netlify adapter, including a new `@astrojs/netlify/static` adapter for static sites. 

No changes are necessary when using SSR. Simply use configured redirects and the adapter will update your `_redirects` file.
