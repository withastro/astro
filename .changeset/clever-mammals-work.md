---
'@astrojs/solid-js': patch
---

Fixes a build crash when a Solid island imports a package that ships pre-compiled browser artifacts via the `exports.solid` condition (e.g. `@kobalte/core`). Solid ecosystem packages are now bundled in non-client environments so that Vite resolves the correct export condition during prerendering.
