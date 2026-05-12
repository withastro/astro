---
'astro': patch
---

Fixes a regression where `Astro.cache` was `undefined` when `experimental.cache` was not configured. 

The previous documented behavior is for `Astro.cache` to always be defined as a no-op shim: `cache.set()` warns once, `cache.invalidate()` throws and `cache.enabled` can be used to gate. This allows library and user code can call cache methods without conditional checks. The cache provider registration was being gated at the call site on `experimental.cache` being configured, which meant the disabled shim branch inside the provider was unreachable and the `Astro.cache` getter was never attached to the context.
