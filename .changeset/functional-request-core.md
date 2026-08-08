---
'astro': patch
---

Refactors Astro's internal server-side request handling into a purely functional core. Request-handling behavior that previously lived on internal `App`/`Pipeline` class hierarchies is now expressed as plain functions that read their static, build-time data from the manifest (available to bundled code as the `virtual:astro:manifest` module) plus per-request state. `App` and `NodeApp` remain public API with unchanged constructor signatures and method surfaces — they are now thin facades that delegate to the functional core — and `app.pipeline` remains available as a stateless compatibility shim. No public API changes are intended.

A few micro edge cases change for external code that combined undocumented internals (none are covered by any documented surface):

- `app.pipeline.usedFeatures` is now a read-only getter; external code performing `app.pipeline.usedFeatures |= x` will throw. This was never a documented surface.
- A custom `src/fetch.ts` fetch handler's own `new FetchState(request)` now resolves the ambient (bundled) manifest instead of an app handle previously smuggled on the request. Consequences, all confined to projects combining a custom fetch entrypoint with other advanced usage: an `App` constructed over a custom manifest no longer influences the manifest such a state sees; an `App` constructed with streaming disabled no longer influences such a state's streaming default (the environment default, streaming enabled, applies); and instance patches or subclass overrides of `app.renderError` / `app.logRequest` are not reflected on states the handler constructs itself (the environment-strategy defaults apply). States created through `app.render()` behave exactly as before.
- Two lazily-thrown internal error messages changed: constructing `new FetchState(request)` outside an Astro-built server now fails with a "No manifest available" error (previously it reported a request without an attached app), and the internal "No fetch handler provided." error no longer exists.
- Dev-only: with a custom `src/fetch.ts`, after an edit causes the dev module runner to re-evaluate the manifest module, the one-shot missing-feature warnings may read the re-evaluated manifest's feature bits rather than the pre-edit ones.
