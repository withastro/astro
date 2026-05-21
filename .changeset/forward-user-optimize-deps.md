---
'@astrojs/cloudflare': patch
---

Forwards user-provided `optimizeDeps` settings (exclude, include, esbuildOptions.loader) to SSR/prerender environments. Previously, top-level `vite.optimizeDeps` in the Astro config was silently ignored for server environments because Vite 6 scopes it to client-only and the adapter's `configEnvironment` hook did not forward it. This caused packages with non-standard file types (e.g. `.data` files) to fail during dev-mode dependency optimization with errors like "No loader is configured for '.data' files".
