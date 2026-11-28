---
'astro': patch
---

Fixes a build where an image imported and used through its `src` was deleted from the output because another file with identical content was only used with `<Image />` or `getImage()`
