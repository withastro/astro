import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cache, url }) => {
	await cache.invalidate({ tags: [url.searchParams.get('tag')!] });
	return new Response(null, { status: 204 });
};
