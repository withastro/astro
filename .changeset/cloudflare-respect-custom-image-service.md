---
'@astrojs/cloudflare': patch
---

Preserve user-defined image services when the Cloudflare adapter is used. Previously, the adapter's `imageService` mode (including the default `'cloudflare-binding'` and `'compile'`) would silently overwrite a custom `image.service` configured in `astro.config.*`, replacing it with the workerd image service. Custom services (e.g., third-party CDNs) are now preserved across all modes, matching the behavior of the explicit `'custom'` mode.

Additionally, the workerd prerenderer no longer hard-swaps `globalThis.astroAsset.imageService` to `astro/assets/services/sharp` for byte-level static image generation when a custom service is in use. Previously the `'compile'` mode bypassed the preserved service during the Node-side image generation pass; it now uses the user's configured service throughout the build.
