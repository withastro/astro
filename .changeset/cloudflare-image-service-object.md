---
"@astrojs/cloudflare": minor
---

Adds support for configuring the image service as an object with separate `build` and `runtime` options. It is now possible to set both a build time and runtime service independently. Currently, `'compile'` is the only available build time option. The supported runtime options are `'passthrough'` (default) and `'cloudflare-binding'`.
