import { astro, FetchState } from 'astro/fetch';
import { cf as cfFetch } from '@astrojs/cloudflare/fetch';
import { cf as cfHono } from '@astrojs/cloudflare/hono';

const honoMiddleware = cfHono();

// The documented "advanced" custom worker: build the request state from the
// bare workerd request, let cf() serve static assets, and hand everything
// else to Astro.
export default {
	async fetch(request, env, ctx) {
		if (new URL(request.url).pathname === '/hono') {
			const values = new Map<string, unknown>();
			let response = new Response();
			let responseAssignments = 0;
			const context = {
				req: { raw: request },
				env,
				executionCtx: ctx,
				get res() {
					return response;
				},
				set res(value: Response) {
					responseAssignments++;
					response = value;
				},
				get(key: string) {
					return values.get(key);
				},
				set(key: string, value: unknown) {
					values.set(key, value);
				},
			};
			const handled = await honoMiddleware(context, async () => {
				context.res = await astro(context.get('fetchState') as FetchState);
			});
			response = handled ?? context.res;
			response.headers.set('X-Hono-Response-Assignments', String(responseAssignments));
			return response;
		}

		const state = new FetchState(request);
		const asset = await cfFetch(state, env, ctx);
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
