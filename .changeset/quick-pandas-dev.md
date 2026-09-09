---
'astro': patch
---

Improves dev server startup time. The content config load now starts during server creation instead of blocking it, and the dev server app module graph is compiled lazily on the first request instead of on the critical path. This cuts `astro dev` ready time by roughly a third on projects with a content config.