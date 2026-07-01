---
'astro': patch
---

Fixes a crash when using Astro's `getViteConfig` with Vitest browser mode (e.g., Storybook vitest runner). Astro now skips dev server setup inside Vitest, preventing errors.
