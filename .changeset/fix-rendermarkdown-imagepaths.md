---
'astro': patch
---

Fixes `renderMarkdown` in custom content loaders not populating `metadata.imagePaths`, which prevented image optimization from working. The runtime's `renderEntry` checks for `imagePaths` to resolve `__ASTRO_IMAGE_` placeholders, but `renderMarkdown` only returned `localImagePaths` and `remoteImagePaths` as separate fields. This change combines them into `imagePaths`, matching the behavior of the built-in `glob()` loader's render function.
