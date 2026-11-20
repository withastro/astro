---
'astro': patch
---

Fixes builds failing with `EXDEV: cross-device link not permitted` when `outDir` is outside the project and on a different filesystem, such as another drive or mount, and a page uses an image or other bundled asset
