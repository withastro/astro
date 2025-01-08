---
'@astrojs/underscore-redirects': minor
---

Updates how the output is determined in `createRedirectsFromAstroRoutes`. Since `v0.5.0`, the output would use the `buildOutput` property and `config.output` as a fallback. It no longer uses this fallback.
