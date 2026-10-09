---
'@astrojs/underscore-redirects': patch
---

Fixes definitions with a `weight` of `0` being sorted above higher weighted definitions, such as the `/*` 404 fallback appearing first in `_redirects`
