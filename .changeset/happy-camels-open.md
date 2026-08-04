---
'astro': patch
---

Fixes middleware HMR not responding to changes in imported modules. Previously, editing a file imported by `middleware.ts` would not trigger a middleware reload — only direct edits to the middleware file itself were detected. The middleware now correctly reloads when any of its transitive dependencies change.
