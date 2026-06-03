---
'@astrojs/cloudflare': patch
---

Fixes a build crash when using `experimental.advancedRouting` with a custom `fetchFile` that statically imports `cf` from `@astrojs/cloudflare/fetch`. The circular dependency between `@astrojs/cloudflare/fetch` and `astro/app/entrypoint` caused `createApp` or `createGetEnv` to be `undefined` at module evaluation time. Initialization is now deferred to the first `cf()` call, breaking the cycle.
