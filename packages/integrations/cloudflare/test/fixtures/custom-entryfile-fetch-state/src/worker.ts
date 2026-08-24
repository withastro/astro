import { astro, FetchState } from 'astro/fetch';
import { cf } from '@astrojs/cloudflare/fetch';

// The documented "advanced" custom worker: build the request state from the
// bare workerd request, let cf() serve static assets, and hand everything
// else to Astro.
export default {
	async fetch(request, env, ctx) {
		const state = new FetchState(request);
		const asset = await cf(state, env, ctx);
		if (asset) return asset;
		const response = await astro(state);
		// Clone response to make headers mutable, add custom header to prove this worker handled the request
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: {
				...Object.fromEntries(response.headers.entries()),
				'X-Fetch-State-Entrypoint': 'true',
			},
		});
	},
} satisfies ExportedHandler<Env>;
