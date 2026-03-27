---
'astro': patch
---

Fix shared Vue component styles being dropped on `client:only` pages when the same components are also used from hydrated routes.
