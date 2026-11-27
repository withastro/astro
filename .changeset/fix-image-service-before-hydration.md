---
'astro': patch
'@astrojs/vite-plugin-astro': patch
---

Fixes build-time image optimization failing with `InvalidImageService` when an integration injects a `before-hydration` script (such as `@clerk/astro`)

`astro:scripts:before-hydration` no longer emits a `before-hydration` chunk into the `astroImageService` build environment, and `loadBuildImageService()` now matches the `virtual:astro:image-service-entry` facade module instead of importing the first entry chunk in the build output.
