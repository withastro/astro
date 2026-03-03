---
'@astrojs/cloudflare': major
---

Removes the `workerEntryPoint` option, which wasn't used anymore. Set the `main` field of your wrangler config instead

See [how to migrate](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#changed-custom-entrypoint-api)