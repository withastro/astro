---
'astro': patch
---

Improves dev server startup time. The content config and dev server app module graphs now begin compiling during server creation without blocking the server from listening. Request handling waits for the shared setup result when needed, cutting `astro dev` ready time by roughly a third on projects with a content config.
