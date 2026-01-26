import type { APIRoute } from 'astro';
import { transform } from '../utils/image-binding-transform.js';

export const prerender = false;

// @ts-expect-error The Header types between libdom and @cloudflare/workers-types are causing issues
export const GET: APIRoute = async (ctx) => {
	const { env } = await import('cloudflare:workers');
	// @ts-expect-error The runtime locals types are not populated here
	return transform(ctx.request.url, env.IMAGES, env.ASSETS);
};
