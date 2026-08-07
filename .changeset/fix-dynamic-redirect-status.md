---
'@astrojs/underscore-redirects': patch
---

Fixes dynamic redirect routes to honour user-configured status codes instead of hardcoding 301. Previously, a redirect configured with `{ destination: '/new', status: 302 }` would be emitted as 301 in the `_redirects` file when the route was dynamic.
