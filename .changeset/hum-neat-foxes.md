---
'astro': patch
---

Fixes a crash when running Vitest with browser mode (e.g. Storybook vitest runner) in Astro projects that use `getViteConfig()`. The `astro:server` Vite plugin's `configureServer` hook now skips dev server setup when `process.env.VITEST` is set, preventing a `TypeError: Cannot read properties of undefined (reading 'wrapDynamicImport')` error caused by Vitest's browser server module evaluator not fully supporting dynamic imports.
