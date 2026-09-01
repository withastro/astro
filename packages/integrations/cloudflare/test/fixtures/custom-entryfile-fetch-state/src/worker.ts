import { astro, FetchState, pages } from 'astro/fetch';
import { cf as cfFetch, finalize } from '@astrojs/cloudflare/fetch';
import { cf as cfHono } from '@astrojs/cloudflare/hono';

const honoMiddleware = cfHono();

// The documented "advanced" custom worker: build the request state from the
// bare workerd request, let cf() serve static assets, and hand everything
// else to Astro.
export default {
	async fetch(request, env, ctx) {
		const pathname = new URL(request.url).pathname;
		if (pathname === '/hono' || pathname === '/hono-immutable') {
			const values = new Map<string, unknown>();
			let response: Response | undefined;
			let responseAssignments = 0;
			const context = {
				req: { raw: request },
				env,
				executionCtx: ctx,
				get res() {
					return (response ??= new Response());
				},
				set res(value: Response) {
					responseAssignments++;
					if (response) {
						value = new Response(value.body, value);
						for (const [name, headerValue] of response.headers) {
							if (name === 'content-type') continue;
							if (name === 'set-cookie') {
								value.headers.delete(name);
								for (const cookie of response.headers.getSetCookie()) {
									value.headers.append(name, cookie);
								}
							} else {
								value.headers.set(name, headerValue);
							}
						}
					}
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
				const state = context.get('fetchState') as FetchState;
				if (pathname === '/hono') {
					context.res = await pages(state);
				} else {
					state.cookies.set('hono-immutable', '1', { path: '/' });
					context.res = Response.redirect('https://example.com/');
				}
			});
			response = handled ?? context.res;
			response.headers.set('X-Hono-Response-Assignments', String(responseAssignments));
			return response;
		}

		const state = new FetchState(request);
		const asset = await cfFetch(state, env, ctx);
		if (asset) return asset;
		const response = await astro(state);
		response.headers.set('X-Fetch-State-Entrypoint', 'true');
		return finalize(state, response);
	},
} satisfies ExportedHandler<Env>;
