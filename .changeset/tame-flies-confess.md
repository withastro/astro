---
'astro': major
---

build.format: 'file' now honors index routes

Prior to Astro 4, using `build.format: 'file'`, a method to produce HTML files that are *not* all within folders, would only produce `index.html` for the base path of `/`. This meant that even if you created explicit index pages with, for example, `page/index.astro`, it would write these out as `page.html`.

This was unexpected behavior as `build.format: 'file'` is intended to match the file system routing exactly. Now in Astro 4 it does, with index routes being written just as they are in your source directly. `page/index.astro` becomes `page/index.html`.

This change only affects SSG when using `build.format: 'file'`.
