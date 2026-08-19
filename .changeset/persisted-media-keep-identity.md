---
'astro': patch
---

Fixes `<audio>` and `<video>` elements inside `transition:persist` elements being re-created on every `<ClientRouter />` navigation (since 7.2.1), which reset playback and dropped listeners of persistent players
