---
'astro': minor
---

Reworks how prerendered images are tracked during the build, so optimized images and their originals are now reported per page instead of through a global

Reading only an imported image's `width` or `height` no longer keeps its original file in the build output. Reading its `src` still does.

Adapters that provide a custom prerenderer can use two new optional hooks on `AstroPrerenderer`: `collectUnattributedMetadata()` and `getImageService()`. `teardown()` now runs after images are generated. A prerenderer that renders outside of Astro's build process must now call `setStaticImageConfig()` and `installRenderScope()` from `astro/app` for `getImage()` to produce build-time image URLs. `collectStaticImages()` is deprecated, and `globalThis.astroAsset` is no longer populated, so it can no longer receive images collected through it.
