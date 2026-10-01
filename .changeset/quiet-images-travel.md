---
'astro': minor
---

Reworks how prerendered images are tracked during the build, so optimized images and their originals are now reported per page instead of through a global

Reading only an imported image's `width` or `height` no longer keeps its original file in the build output. Reading its `src` still does.

Adapters that provide a custom prerenderer can use a new optional `getImageService()` hook on `AstroPrerenderer`, and `getStaticPaths()` can now return `{ paths, metadata }` to report the images resolved while computing paths. `teardown()` now runs after images are generated.

A prerenderer that renders outside of Astro's build process gets build-time image URLs from `getImage()` while it collects metadata: install a render scope with `installRenderScope()` from `astro/app`, render pages with `renderForPrerender()`, and compute paths with `StaticPaths.getAllWithMetadata()` from `astro:static-paths`. Both accept `staticImages: false` to keep the image service's runtime URLs in prerendered pages. `collectStaticImages()` and `recordStaticImage()` are deprecated, and `globalThis.astroAsset` is no longer populated.
