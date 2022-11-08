---
'astro': patch
---

404 when not using subpath for items in public in dev

Previously if using a base like `base: '/subpath/` you could load things from the root, which would break in prod. Now you must include the subpath.
