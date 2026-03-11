---
'astro': patch
---

Fixes a regression where the the routes emitted by the `astro:build:done` hook didn't have the `distURL` array correctly populated.
