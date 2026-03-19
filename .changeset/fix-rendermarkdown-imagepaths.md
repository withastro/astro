---
'astro': patch
---

Fixes `renderMarkdown` in custom content loaders not resolving images in markdown content. Images referenced in markdown processed by `renderMarkdown` are now correctly optimized, matching the behavior of the built-in `glob()` loader.
