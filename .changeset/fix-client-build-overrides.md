---
"astro": patch
---

Fixes `vite.build.minify`, `vite.build.sourcemap`, and `vite.build.rollupOptions.output` (e.g. `compact`) being ignored for client-side builds. These top-level Vite build options are now properly forwarded to the client environment, with environment-specific overrides (`vite.environments.client.build.*`) taking priority when set.
