---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Removes the `getFontBuffer()` helper function exported from `astro:assets` when using the experimental Fonts API

It would cause significant memory usage during build. It will be reintroduced later on.

If you were relying on this function, here is how you could replicate the previous behavior:

- On prerendered routes, read the file using `node:fs`
- On server rendered routes, fetch files using URLs from `fontData` and `context.url`
