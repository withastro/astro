---
'astro': patch
---

Fixes build slowness on large apps

This fixes slowness on large apps, particularly during the static build. Fix is to prevent the Vite dev server plugin from being run during build, as it is not needed.
