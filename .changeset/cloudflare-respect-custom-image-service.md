---
'@astrojs/cloudflare': patch
---

Preserve user-defined image services when the Cloudflare adapter is used. Previously, the adapter's `imageService` mode (including the default `'cloudflare-binding'` and `'compile'`) would silently overwrite a custom `image.service` configured in `astro.config.*`, replacing it with the workerd image service. Custom services (e.g., third-party CDNs) are now preserved across all modes, matching the behavior of the explicit `'custom'` mode.
