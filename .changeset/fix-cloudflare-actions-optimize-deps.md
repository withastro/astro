---
'@astrojs/cloudflare': patch
---

Fixes build failures when using `src/actions/index.ts` with the Cloudflare adapter in non-workspace npm/pnpm environments. The SSR dependency optimizer could discover action-related dependencies (`zod/v4`, `devalue`, etc.) at runtime instead of pre-bundling them, triggering sequential re-optimizations that race with the workerd module runner and cause "file does not exist" errors. Added direct `optimizeDeps.include` entries as fallback for the existing `astro > <dep>` nested includes, which can silently fail to resolve in certain package manager layouts.
