---
'astro': patch
---

Fixes dev errors in hydrated components

The errors would occur when there was state changes in hydrated components. This only occurs in dev but does result in the hydrated component not working. This fixes the underlying issue.
