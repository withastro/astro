---
'@astrojs/cloudflare': major
---

Updates the adapter to use v2 of `@cloudflare/vite-plugin` and support deployment with `cf`.

Projects should replace Wrangler configuration with `cloudflare.config.ts`, importing configuration utilities from `cf/config`. `cf` should also be used in place of Wrangler for deployment.

The adapter’s `configPath` option has been removed. Configuration is always loaded from a `cloudflare.config.ts` file in the project root.

`wrangler` is no longer a peer dependency of `@astrojs/cloudflare`.
