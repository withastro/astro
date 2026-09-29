---
'astro': patch
---

Fixes the `glob()` content loader skipping Markdown and data files that have `#` or `?` in their path (e.g. `c#-basics.md`). MDX, Markdoc and `deferRender` entries with these characters are still skipped, with an error that explains how to fix it.
