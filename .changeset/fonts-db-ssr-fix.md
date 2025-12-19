---
'@astrojs/db': patch
---

Fixes a build error when using `experimental.fonts` alongside `@astrojs/db` with the Cloudflare adapter. The error occurred because `css-tree` (a dependency of the fonts feature) was being bundled in SSR mode, which breaks in Cloudflare workers. This fix externalizes `css-tree` from the temporary Vite server used during builds.
