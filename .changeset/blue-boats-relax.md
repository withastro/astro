---
'astro': major
---

Unflag globalRoutePriority

The previously experimental feature `globalRoutePriority` is now the default in Astro 5.

This was a refactoring of route prioritization in Astro, making it so that injected routes, file-based routes, and redirects are all prioritized using the same logic. This feature has been enabled for all Starlight projects since it was added and should not affect most users.
