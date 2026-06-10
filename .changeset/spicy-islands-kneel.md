---
'astro': patch
---

Fixes HMR for `?raw` CSS imports. Changing a CSS file imported with `?raw` now correctly triggers a full page reload during development.
