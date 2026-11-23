---
'@astrojs/solid-js': major
'@astrojs/solid-js-renderer': minor
---

Adds support for Solid 2.0 (requires `solid-js@^2.0.0` and `@solidjs/web@^2.0.0`)

This major version supports Solid 2.0 only; use `@astrojs/solid-js@7` (and `@astrojs/solid-js-renderer@0.1`) for Solid 1.x projects. The Solid 2.0 renderer lives in `@astrojs/solid-js-renderer`, which the integration re-exports.

Highlights:

- Compiles through `@solidjs/vite-plugin` (replacing `vite-plugin-solid`), with an optional `compiler` option to select the native or Babel backend.
- Islands render through Solid 2.0's first-class async model (`renderToStream`), with no Suspense wrapper: async islands settle fully on the server, and error boundaries (`Errored`) contain both sync and async errors.
- Threads an asset manifest into server renders so `lazy()` boundary modules inside islands resolve their module URLs, hydrate through serialized asset maps, and have their CSS inlined into the island markup (deduped per page) — in dev via the plugin's live resolver, in production via the client build manifest.
- Component detection (`check()`) now probe-renders through the stream renderer with per-component caching, rejects foreign framework vnodes explicitly, and no longer breaks on Proxy-based components.
- Removes the `solid-devtools` integration option (the Solid 2.0 devtools story is not settled yet).
