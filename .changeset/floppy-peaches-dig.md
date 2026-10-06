---
'astro': patch
---

Fixes a build error when a Markdown content collection entry loaded with `glob({ deferRender: true })` has a `layout` frontmatter property. `layout` is now ignored for content collection entries, as documented.
