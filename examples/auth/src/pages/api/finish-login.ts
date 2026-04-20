import type { APIRoute } from 'astro';

export const prerender = false;

// This route gets intercepted by the middleware.
export const GET: APIRoute = async () => {
	return new Response('Finish login', { status: 200 });
};
