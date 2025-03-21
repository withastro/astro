---
'astro': patch
---

Fixes an issue where the `ActionAPIContext` inherited methods from `APIContext`, resulting in exposing internal methods that shouldn't be available at runtime.
