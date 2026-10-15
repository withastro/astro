---
'astro': patch
---

Fixes a build error when an integration sets `image.service` to an object with only `undefined` values (for example `@astrojs/netlify` with `imageCDN: false`) while the user config uses separate `build` and `runtime` image services
