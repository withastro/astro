---
'astro': patch
---

Fixes `pushDirective` in the CSP runtime duplicating the new directive once per existing non-matching directive. Calling `insertDirective()` (or otherwise pushing a directive whose name is not yet in the list) now appends it exactly once, and a directive that merges with a later existing entry no longer leaves an unmerged copy behind.
