---
'@astrojs/cloudflare': major
---

Updates the Wrangler entrypoint

Previously, the `main` field in `wrangler.jsonc` pointed to the built output, since Wrangler only ran in production after the build completed:

```jsonc
{
  "main": "dist/_worker.js/index.js"
}
```

Now that Wrangler runs in both development (via workerd) and production, Astro provides a default entrypoint that works for both scenarios.

#### What should I do?

Update your `wrangler.jsonc` to use the new entrypoint:

```jsonc
{
  "main": "@astrojs/cloudflare/entrypoints/server"
}
```

This single entrypoint handles both `astro dev` and production deployments.
