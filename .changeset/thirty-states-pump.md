---
'astro': minor
'@astrojs/cloudflare': minor
---

Adds `FetchState.hasMatchedRoute()` and a Cloudflare `finalize()` response handler

`hasMatchedRoute()` reports whether the original request matched an Astro route. This differs from checking `state.routeData`, which can contain Astro's internal `/404` fallback for an unmatched request.

Call `finalize()` to apply cookies and Cloudflare CDN cache defaults to the response from an `astro/fetch` pipeline:

```ts
import { astro, FetchState } from 'astro/fetch';
import { cf, finalize } from '@astrojs/cloudflare/fetch';

export default {
	async fetch(request: Request, env: Env, context: ExecutionContext) {
		const state = new FetchState(request);
		const asset = await cf(state, env, context);
		if (asset) return asset;

		return finalize(state, await astro(state));
	},
};
```

The `@astrojs/cloudflare/hono` middleware applies these response headers automatically. Cloudflare custom entrypoints also fall back to static assets when no Astro route matches and use the default server entrypoint when prerendering through workerd.
