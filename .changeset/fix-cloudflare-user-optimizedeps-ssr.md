---
"@astrojs/cloudflare": patch
---

Fixes user-configured `optimizeDeps.exclude` and `optimizeDeps.esbuildOptions.loader` being silently ignored for SSR/prerender environments. In Vite 6, top-level `optimizeDeps` only applies to the client environment, but the Cloudflare adapter now forwards those settings into its server-environment dep optimization so packages with non-standard file extensions (e.g. `.data`, `.wasm`) can be properly excluded or handled.
