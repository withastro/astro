import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = (ctx) => {
	const href = ctx.url.searchParams.get('href');
	if (!href) {
		return new Response("Missing 'href' query parameter", {
			status: 400,
			statusText: "Missing 'href' query parameter",
		});
	}

	return fetch(new URL(href, ctx.url.origin));
};
