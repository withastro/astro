---
'@astrojs/node': patch
---

Fixes `Astro.locals` being empty on the 404 page when the middleware-mode handler is called with `locals` but without a `next` callback
