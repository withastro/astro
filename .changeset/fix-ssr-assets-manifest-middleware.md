---
'astro': patch
---

Fixes CSS, fonts, and other assets failing to load when using `@astrojs/node` in middleware mode with a catch-all route. Previously these assets were incorrectly matched by the catch-all instead of being served as static files.
