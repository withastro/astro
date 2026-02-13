---
"@astrojs/cloudflare": minor
---

Changes the default image service from `compile` to `cloudflare-binding`. Image services options that resulted in broken images in development due to Node JS incompatiblities have now been updated to use the passthrough image service in dev mode.
