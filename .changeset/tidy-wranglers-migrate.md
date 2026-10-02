---
'@astrojs/cloudflare': patch
---

Fails the build with a migration hint when a project has a `wrangler.json`, `wrangler.jsonc`, or `wrangler.toml` file but no `cloudflare.config.ts`. Previously the build succeeded and the Worker name, bindings, and entrypoint from the Wrangler file were silently ignored. Run `npx cf migrate --bundler vite` to generate `cloudflare.config.ts` from your existing Wrangler configuration.
