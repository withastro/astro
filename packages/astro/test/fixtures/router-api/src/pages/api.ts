import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = (context) =>
	Response.json({ greeting: (context as unknown as { greeting: string }).greeting });
