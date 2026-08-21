---
'astro': patch
---

Fixes a type error when passing an image from a content collection `image()` schema to a component or `<Image />`. The schema returned by `image()` was missing the `apng` format, so it no longer matched the type of an imported image.
