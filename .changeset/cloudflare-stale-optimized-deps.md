---
'@astrojs/cloudflare': patch
---

Fixes React "Invalid hook call" errors when Vite's SSR dependency optimizer re-runs mid-session in dev

When a request pulled in a dependency that was not part of the pre-optimized set (for example, a newly added island importing a package like `@phosphor-icons/react`), Vite re-optimized the server environment's dependencies and renamed the optimized module URLs. Modules already evaluated inside workerd kept the old React copy while newly evaluated modules loaded the new one, splitting React into two instances and breaking hooks in every island — often until `node_modules/.vite` was cleared and the dev server restarted.

The adapter now sets `optimizeDeps.ignoreOutdatedRequests: false` for the server environments, restoring Vite's built-in recovery: a request that races the re-optimization fails fast with a clear "new version of the pre-bundle" error and the next request renders cleanly against a single React instance.
