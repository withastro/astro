---
'astro': patch
---

Fixes an issue where editing a client-side component (e.g. with `client:idle`, `client:load`, etc.) caused an unnecessary full program reload of the backend during development.
