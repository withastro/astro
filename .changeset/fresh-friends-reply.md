---
'astro': patch
---

Fixes the dev server crashing or no longer picking up new routes when the entrypoint of a route added with `injectRoute()` is deleted while `astro dev` runs. The route is now skipped with a warning until the file is restored.
