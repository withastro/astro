import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const contentType = request.headers.get('content-type') || '';
	if (contentType.includes('application/x-www-form-urlencoded')) {
		const form = await request.formData();
		return new Response(JSON.stringify({ message: form.get('message') }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}
	const text = await request.text();
	return new Response(JSON.stringify({ body: text }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
