---
'astro': minor
'@astrojs/cloudflare': patch
---

Adds `FetchState.hasMatchedRoute()` for custom request handlers.

`hasMatchedRoute()` reports whether the original request matched an Astro route. This differs from checking `state.routeData`, which can contain Astro's internal `/404` fallback for an unmatched request:

```ts
import { astro, FetchState } from 'astro/fetch';

export default {
	async fetch(request: Request, env: Env) {
		const state = new FetchState(request);
		if (!state.hasMatchedRoute()) {
			const asset = await env.ASSETS.fetch(request);
			if (asset.ok) return asset;
		}

		return astro(state);
	},
};
```

The Cloudflare adapter uses this method to restore `run_worker_first` asset fallback for custom worker entrypoints without matching the route twice. It also uses the default server entrypoint for its dedicated prerender worker, allowing custom worker projects to prerender routes through workerd.
