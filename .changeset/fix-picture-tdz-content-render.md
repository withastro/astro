---
'astro': patch
---

Fixes a build error that occurred when a pre-rendered page used the `<Picture>` component and another page called `render()` on content collection entries.
