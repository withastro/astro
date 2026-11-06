---
'create-astro': patch
---

Fixes the `package.json` name of a project created in a nested or absolute directory, such as `npm create astro@latest apps/web`, which was set to `apps-web` instead of `web`
