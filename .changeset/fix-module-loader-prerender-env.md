---
'astro': patch
---

Fixes the per-environment module loader returning the wrong Vite dev environment from `getSSREnvironment()`. With adapters like `@astrojs/cloudflare` configured with `prerenderEnvironment: 'node'`, a separate `prerender` Vite environment is created and a dedicated loader is built for it; the loader now correctly returns the environment it was constructed for, so `getComponentMetadata()` crawls the right module graph for prerendered routes in dev.
