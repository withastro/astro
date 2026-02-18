---
"astro": patch
---

Fix original images from prerendered pages being exposed in SSR build output. Previously, unoptimized source images were incorrectly retained in the client `_astro/` directory for SSR builds, allowing the originals to be accessed by guessing the filename. Now, originals that are only used for optimization are deleted, while directly-referenced originals (e.g. via `<img src={img.src}>`) are preserved.
