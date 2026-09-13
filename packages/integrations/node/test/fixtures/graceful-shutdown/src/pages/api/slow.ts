import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
	const delay = Number(new URL(request.url).searchParams.get('delay') ?? '200');
	await new Promise<void>((resolve) => setTimeout(resolve, delay));
	return new Response('slow response');
};
