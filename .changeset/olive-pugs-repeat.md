---
'astro': patch
---

Fixes the dev server re-evaluating its whole server module graph on every request in projects where unrelated files under the project root are written while requests run, such as Cloudflare's `.wrangler/state` files. The `astro:head-metadata` plugin invalidated its component metadata virtual module for any watched file, and because the dev app entrypoint imports that module, each invalidation made the module runner re-evaluate the server graph on the next request — re-transforming page modules and everything they import. Watcher-driven invalidations are now limited to files that belong to the `ssr` or `prerender` module graph, which are the only files that can change the metadata the module reports.
