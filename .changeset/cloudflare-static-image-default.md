---
"@astrojs/cloudflare": patch
"astro": patch
---

Fixes default image service for `@astrojs/cloudflare` adapter with static output. When no `imageService` is explicitly set and the output mode is `static`, the adapter now defaults to `'compile'` instead of `'cloudflare-binding'`. The `'cloudflare-binding'` service requires a worker runtime to handle `/_image` requests, which does not exist in static deployments. This also fixes a path resolution issue in Astro core where `prepareAssetsGenerationEnv` did not account for `preserveBuildClientDir`, causing image optimization to fail when the adapter places static assets in a separate client directory.
