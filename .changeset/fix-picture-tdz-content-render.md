---
'astro': patch
---

Fixes a build error (`Cannot access '$$Picture' before initialization`) that occurred when a prerendered page used the `<Picture>` component and another page called `render()` on content collection entries
