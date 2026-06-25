---
'astro': patch
---

Fixes a crash when using Astro's `getViteConfig` with Vitest browser mode (e.g., Storybook vitest runner). The `astro:server` plugin's `configureServer` hook now skips dev server setup inside Vitest, preventing a `TypeError: Cannot read properties of undefined (reading 'wrapDynamicImport')` error.
