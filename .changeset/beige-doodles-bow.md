---
'astro': patch
---

Removes `state.provide()`, `state.resolve()`, `state.finalizeAll()`, and `App.Providers` from the public advanced routing API. These context provider extension points are now internal-only. If you were using them in an integration, use `locals` to share per-request state instead.
