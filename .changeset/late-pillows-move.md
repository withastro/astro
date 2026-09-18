---
'astro': patch
---

Fixes incremental builds unnecessarily re-rendering pages whose CSS references emitted assets (e.g. fonts via `url()`)
