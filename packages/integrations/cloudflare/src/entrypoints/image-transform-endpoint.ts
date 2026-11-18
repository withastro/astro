import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { transform } from '../utils/image-binding-transform.js';
import type { Runtime } from '../utils/handler.js';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
	const cache = (caches as unknown as { default?: Cache }).default;

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

	// waitUntil keeps the worker alive until the cache write completes
	if (cache) {
		const cfContext = (ctx.locals as Partial<Runtime>).cfContext;
		if (cfContext) {
			cfContext.waitUntil(cache.put(ctx.request.url, cachedResponse.clone()));
		}
	}

	return cachedResponse;
};
