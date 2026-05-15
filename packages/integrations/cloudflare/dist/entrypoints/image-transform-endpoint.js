import { env } from 'cloudflare:workers';
import { transform } from '../utils/image-binding-transform.js';
const prerender = false;
const GET = async (ctx) => {
	const cache = caches.default;
	if (cache) {
		const cached = await cache.match(ctx.request.url);
		if (cached) return cached;
	}
	const response = await transform(ctx.request.url, env.IMAGES, env.ASSETS);
	if (!response.ok) return response;
	const headers = new Headers(response.headers);
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	const cachedResponse = new Response(response.body, {
		status: response.status,
		headers,
	});
	if (cache) {
		const cfContext = ctx.locals.cfContext;
		if (cfContext) {
			cfContext.waitUntil(cache.put(ctx.request.url, cachedResponse.clone()));
		}
	}
	return cachedResponse;
};
export { GET, prerender };
