---
'@astrojs/cloudflare': minor
---

The Wrangler configuration file is now optional. If you don't have custom Cloudflare bindings (KV, D1, Durable Objects, etc.), Astro will automatically generate a default configuration for you.

##### What should I do?

If your `wrangler.jsonc` only contains basic configuration like this:

```jsonc
{
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2025-05-21",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  }
}
```

You can safely delete the file. Astro will handle this configuration automatically.

You only need a wrangler config file if you're using:
- KV namespaces
- D1 databases
- Durable Objects
- R2 buckets
- Environment variables
- Custom compatibility flags
- Other Cloudflare-specific features
