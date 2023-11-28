---
'astro': minor
---

build.format: 'preserve' to preserve source structure in final build

Using `build.format: 'file'`, a method to produce HTML files that are *not* all within folders, it will only produce `index.html` for the base path of `/`. This meant that even if you create explicit index pages with, for example, `page/index.astro`, it would write these out as `page.html`.

This is a bit unexpected, but rather than make a breaking change to `build.format: 'file'` we decided to create a new `build.format: 'preserve'`.

The new format will preserve how the filesystem is structured and make sure that is mirrored over to production. Using this option:

- `page.astro` becomes `page.html`
- `page/index.astro` becomes `page/index.html`
