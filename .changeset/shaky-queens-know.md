---
'astro': patch
---

Fixes a dev server error where an SSR full reload triggered by a third-party Vite plugin (such as `@tailwindcss/vite`) could fail with `Failed to load url astro:server-app.js`
