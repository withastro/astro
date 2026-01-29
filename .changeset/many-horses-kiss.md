---
'astro': patch
---

**BREAKING CHANGE to the experimental Fonts API only**

Removes the `getFontBuffer()` helper function exported from `astro:assets` when using the experimental Fonts API

This experimental feature introduced in v15.6.13 ended up causing significant memory usage during build. This feature has been removed and will be reintroduced after further exploration and testing.

If you were relying on this function, you can replicate the previous behavior manually:

- On prerendered routes, read the file using `node:fs`
- On server rendered routes, fetch files using URLs from `fontData` and `context.url`
