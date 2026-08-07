---
'astro': patch
---

Fixes middleware HMR not responding to changes in imported modules. Previously, only direct edits to the middleware file would trigger a reload.
