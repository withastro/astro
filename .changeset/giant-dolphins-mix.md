---
'astro': minor
---

Fixed `tsconfig.json`'s new array format for `extends` not working. This was done by migrating Astro to use [`tsconfck`](https://github.com/dominikg/tsconfck) instead of [`tsconfig-resolver`](https://github.com/ifiokjr/tsconfig-resolver) to find and parse `tsconfig.json` files.
