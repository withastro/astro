---
'@astrojs/language-server': patch
'@astrojs/ts-content-mapper': patch
---

Fixes a crash on load (`this.bridge.setLastError is not a function`) when pnpm resolves `@emnapi/runtime` to a version incompatible with `@astrojs/astro2tsx`, for example alongside `rolldown@1.3.0`
