---
'astro': minor
'@astrojs/cloudflare': patch
---

Adds `FetchState.addResponseFinalizer()` and `FetchState.finalize()` for custom request handlers.

#### Finalizing responses

`addResponseFinalizer()` registers work that must happen after Astro finishes rendering. Finalizers run in registration order and can mutate or replace the response. They are applied automatically when the state is passed to `astro()`:

```ts
import { astro, FetchState } from 'astro/fetch';

export default {
	async fetch(request: Request) {
		const state = new FetchState(request);
		state.addResponseFinalizer((response) => {
			response.headers.set('X-Platform', 'custom');
			return response;
		});

		return astro(state);
	},
};
```

This allows adapters and custom servers to apply platform-specific response headers without requiring a separate finalization call after `astro()`.

Fine-grained pipelines call `finalize()` explicitly after their last response handler:

```ts
import { FetchState, i18n, pages } from 'astro/fetch';

export default {
	async fetch(request: Request) {
		const state = new FetchState(request);
		const response = await i18n(state, await pages(state));
		return state.finalize(response);
	},
};
```

The Cloudflare adapter uses response finalizers to preserve cookies, sessions, and CDN cache headers for custom worker entrypoints without changing the documented `cf(); return astro(state)` flow.
