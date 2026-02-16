import type { APIRoute } from 'astro';
import { transform } from '../utils/image-binding-transform.js';
// NOTE we have to use `cloudflare:workers` since "live" bindings are not populated to process.env
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
	return transform(ctx.request.url, env.IMAGES, env.ASSETS);
};
