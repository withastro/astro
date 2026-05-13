---
'@astrojs/cloudflare': patch
---

Fixes `remoteBindings: false` being ignored during `astro build`. The Cloudflare prerenderer's internal Vite preview server now receives the user's adapter options, so remote-flagged bindings (e.g. a D1 database with `remote: true` in `wrangler.toml`) are emulated locally during build, matching the existing `astro dev` behavior.
