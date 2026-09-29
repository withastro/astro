---
'astro': minor
---

Reworks how prerendered images are tracked during the build, so optimized images and their originals are now reported per page instead of through a global

Reading only an imported image's `width` or `height` no longer keeps its original file in the build output. Reading its `src` still does.

Adapters that provide a custom prerenderer can use three new optional hooks on `AstroPrerenderer`: `collectUnattributedMetadata()`, `generateImages()` and `getImageService()`. A prerenderer that renders outside of Astro's build process must now call `installRenderScope()` from `astro/app` with the `staticImages` config for `getImage()` to produce build-time image URLs. `collectStaticImages()` is deprecated, and `globalThis.astroAsset` is no longer populated, so it can no longer receive images collected through it.
