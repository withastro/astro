---
'astro': patch
---

Fixes image path resolution in content layer collections to support bare filenames. The `image()` helper now normalizes bare filenames like `"cover.jpg"` to relative paths `"./cover.jpg"` for consistent resolution behavior between markdown frontmatter and JSON content collections.
