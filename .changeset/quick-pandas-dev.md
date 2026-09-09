---
'astro': patch
---

Improves dev server startup time. The dev server app and content config module graphs were previously compiled and evaluated on the critical path before the dev server started listening. They are now kicked off early during server creation and awaited lazily on the first request, cutting `astro dev` ready time by roughly a third on projects with a content config.