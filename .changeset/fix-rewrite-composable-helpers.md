---
'astro': patch
---

Fixes the composable request helpers (`astro/fetch`) crashing when invoked after an in-flight rewrite (`Astro.rewrite()` / `next(payload)`). The rewritten request previously lost the internal handle the helpers relied on, so constructing per-request state from it threw; the helpers now resolve the manifest directly and work on rewritten requests.
