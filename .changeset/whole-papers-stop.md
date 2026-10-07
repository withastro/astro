---
'astro': patch
---

Fixes the `glob()` loader not reloading changed files in dev when the pattern starts with an extglob such as `!(drafts)/**/*.md`
