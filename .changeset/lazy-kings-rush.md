---
'astro': patch
---

Fixes an edge case where the client router executed scripts twice when used with a custom swap function that only swaps parts of the DOM.
