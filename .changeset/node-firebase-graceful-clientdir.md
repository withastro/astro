---
'@astrojs/node': patch
---

Fixes a 503 crash on every request when deploying an Astro SSR site to Firebase Hosting with the `webframeworks` experiment. The server no longer crashes on startup when the runtime path does not contain the expected directory structure.
