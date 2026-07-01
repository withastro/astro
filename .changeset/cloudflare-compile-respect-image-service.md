---
'@astrojs/cloudflare': minor
---

Adds configured image service support with the `compile` and `custom` options.

The Cloudflare adapter supports various options that affect how images are processed for both pre-rendered and on-demand routes:
- Setting `imageService: 'compile'` now ensures it is used for pre-rendered routes. When no custom image service is defined, the behavior remains unchanged.
- With `imageService: 'custom'`, assets are now processed at build time for pre-rendered routes. If you have configured an image service, it will be bundled to handle images at runtime; otherwise, the behavior remains unchanged.
- The other `imageService` options remain unchanged.

Learn more about the [image service options](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#imageservice) available in the Cloudflare adapter guide.
