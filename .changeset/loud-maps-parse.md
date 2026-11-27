---
'astro': patch
---

Fixes the `file()` loader swallowing data file parse errors, which allowed `astro build` to exit successfully (code 0) with an empty collection. The parser's error message is now included in the log. During `astro dev`, a file that fails to parse after an edit keeps the previously loaded entries.
