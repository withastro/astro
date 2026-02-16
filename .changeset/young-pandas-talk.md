---
'@astrojs/cloudflare': major
---

Drops official support for Cloudflare Pages in favor of Cloudflare Workers

The Astro Cloudflare adapter now only supports deployment to Cloudflare Workers by default in order to comply with Cloudflare's recommendations for new projects. If you are currently deploying to Cloudflare Pages, consider [migrating to Workers by following the Cloudflare guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) for an optimal experience and full feature support.
