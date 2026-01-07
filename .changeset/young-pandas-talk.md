---
'@astrojs/cloudflare': major
---

Drops official support for Cloudflare Pages in favor of Cloudflare Workers

The Astro Cloudflare adapter now only supports deployment to Cloudflare Workers by default in order to comply with Cloudflare's recommendations for new projects. If you are currently deploying to Cloudflare Pages, consider [migrating to Workers by following the Cloudflare guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) for an optimal experience and full feature support.

You can still opt in to deploy to [Cloudflare Pages](https://developers.cloudflare.com/pages/) by manually updating your project:

1. Configure your build output directories and image service in `astro.config.mjs`:

```diff
export default defineConfig({
	adapter: cloudflare({
+		imageService: 'passthrough',
	}),
	build: {
+		client: './',
+		server: './_worker.js',
	},
});
```

2. Add a custom `_routes.json` file to the `public` directory of your project. It can either be the most basic version below, or you can [customize it](https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file) further based on your needs:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```
