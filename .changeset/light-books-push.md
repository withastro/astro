---
'@astrojs/react': patch
'@astrojs/vue': patch
---

Fixes Vue render-function components failing to build when `@astrojs/react` is also enabled. React's renderer `check` no longer crashes on non-React object components, and Vue's `check` now recognizes `defineComponent()` components that use a `setup` function returning a render function.
