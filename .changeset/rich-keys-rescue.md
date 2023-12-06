---
'astro': patch
---

Fixes an edge case for `<form method="dialog">` when using View Transitions. Forms with `method="dialog"` no longer require an additional `data-astro-reload` attribute.
