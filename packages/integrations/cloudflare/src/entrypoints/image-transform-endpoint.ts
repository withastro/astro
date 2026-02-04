import type { APIRoute } from 'astro';
import { transform } from '../utils/image-binding-transform.js';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
	return transform(ctx.request.url, env.IMAGES, env.ASSETS);
};
