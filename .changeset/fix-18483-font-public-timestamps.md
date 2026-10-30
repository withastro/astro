---
'astro': patch
---

Preserves the last-modified date of cached font files and `public/` files when copying them into the build output. Vite does not forward file timestamps when it copies the public directory, so they were reset to the build time. Font files were also written from a memory buffer instead of copied from cache, losing the original source timestamp. Both paths now use `utimes` to restore the source timestamps after copying.
