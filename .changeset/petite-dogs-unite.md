---
'astro': patch
---

Fixes `prerenderConflictBehavior` not applying to content collection duplicate ID warnings in the `glob()` and `file()` loaders. Setting it to `'error'` now throws during content sync, and `'ignore'` suppresses the warning.
