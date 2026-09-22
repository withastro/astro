---
'astro': patch
---

Fixes the dev server re-evaluating the whole server module graph on every request. The `astro:head-metadata` plugin invalidated its component metadata virtual module from its own `transform` hook, so each evaluation of that module scheduled the next one. Adapters that run requests outside Vite's module runner, such as `@astrojs/cloudflare`, paid for a full re-evaluation of the server graph on every request for the lifetime of the process.
