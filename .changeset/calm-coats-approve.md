---
'astro': minor
---

Allows setting codec-specific defaults for Astro's built-in Sharp image service via `image.service.config`.

You can now configure encoder-level options such as `jpeg.mozjpeg`, `webp.effort`, `webp.alphaQuality`, `avif.effort`, `avif.chromaSubsampling`, and `png.compressionLevel` when using `astro/assets/services/sharp` for compile-time image generation.

These settings apply as defaults for the built-in Sharp pipeline, while per-image `quality` still takes precedence when set on `<Image />`, `<Picture />`, or `getImage()`.
