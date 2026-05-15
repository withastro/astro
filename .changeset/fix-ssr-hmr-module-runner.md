---
'astro': patch
---

Fixes dev server serving stale content when SSR-only modules change (e.g. `.astro` files outside the project root in a monorepo, or dynamically imported components).

Previously, the `astro:hmr-reload` plugin returned an empty array after detecting SSR-only module changes, which prevented Vite's `updateModules` from propagating the invalidation to the SSR module runner. The runner's evaluated module cache stayed stale, so subsequent requests continued returning old content.

Now the plugin returns the SSR-only modules so Vite can process them through `updateModules`, which properly invalidates the module runner's cache and ensures fresh content on the next request.
