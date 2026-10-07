---
'astro': patch
---

Fixes a 500 error when an on-demand rendered endpoint sets a cookie and returns `Response.redirect()` or a `fetch()` response, in servers that render with `addCookieHeader: true` such as `@astrojs/node`.
