---
'astro': patch
---

Fix edge case where default slots could be rendered too early for Astro components. Slots are now only rendered on demand.
