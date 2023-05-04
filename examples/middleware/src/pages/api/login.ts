import { APIRoute } from 'astro';

export const post: APIRoute = async ({ request }) => {
	const data = await request.formData();
	const username = data.get('username');
	const password = data.get('password');
	return new Response(
		JSON.stringify({
			username,
			password,
		}),
		{
			headers: {
				'content-type': 'application/json',
			},
		}
	);
};
