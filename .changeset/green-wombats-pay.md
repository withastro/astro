---
'astro': patch
---

Fix regression that caused some stateful Vite plugins to assume they were running in `dev` mode during the `build` and vice versa.
