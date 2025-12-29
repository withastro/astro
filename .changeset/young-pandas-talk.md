---
'@astrojs/cloudflare': major
---

Drops official support for [Cloudflare Pages](https://developers.cloudflare.com/pages/). You can still deploy your Astro project to Cloudflare Pages using a manual approach. To convert your current project use the following steps. Cloudflare Pages to Cloudflare WOrkers migration guide can be found on the [Cloudflare docs](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)

1. Update your Astro config to output to the correct directory structure:

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
