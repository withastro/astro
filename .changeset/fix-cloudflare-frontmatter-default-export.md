---
'@astrojs/cloudflare': patch
---

Fixes the dependency scan failing with "No matching export for import 'default'" when a `.ts` file default-imports an `.astro` component

The esbuild scan plugin now includes `export default {}` in its output for `.astro` files, preventing the scan from failing and ensuring all dependencies are discovered ahead of time.
