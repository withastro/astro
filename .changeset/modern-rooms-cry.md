---
'@astrojs/cloudflare': patch
---

`vite:dep-scan` intercepted `.astro` files before `astroFrontmatterScanPlugin`, silently skipping frontmatter imports and triggering cascading re-optimization cycles that caused "The file does not exist" crashes in workerd on first request.

Fixed by adding `onResolve` to claim `.astro` files first, pre-including View Transitions modules in optimizeDeps.include, and enabling `ignoreOutdatedRequests` on server environments.
