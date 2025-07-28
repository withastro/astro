---
'astro': patch
---

Fixes a bug in i18n implementation, where Astro didn't emit the correct pages when `fallback` is enabled, and a locale uses a catch-all route, e.g. `src/pages/es/[...catchAll].astro`
