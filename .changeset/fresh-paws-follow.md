---
'astro': patch
---

Fixes `UnknownContentCollectionError` in `astro dev` when running `astro sync` or `astro build` in production mode for the same project. The dev server writes its content import maps to separate files, so a production sync no longer replaces them.
