---
'astro': minor
---

Stops copying original images to the build output when a page only reads their `width` or `height`

Adapter authors with a custom prerenderer: return `{ paths, metadata }` from `getStaticPaths()` and `{ response, metadata }` from `render()` so Astro knows which images to generate. Returning a plain array or `Response` still works but is deprecated. `globalThis.astroAsset` is no longer set.
