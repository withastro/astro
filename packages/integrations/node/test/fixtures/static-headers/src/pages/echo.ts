import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const message = (await request.formData()).get('message');
	return new Response(`message=${message}`);
};
