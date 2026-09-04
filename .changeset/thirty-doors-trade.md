---
'astro': patch
---

Fixes browser back and forward traversal incorrectly triggering a page transition when a same-document history entry is rewritten with `history.replaceState()`.
