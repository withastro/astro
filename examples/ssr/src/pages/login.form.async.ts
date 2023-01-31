import { APIContext, APIRoute } from 'astro';

export const post: APIRoute = ({ cookies, params, request }: APIContext) => {
	// add a new cookie
	cookies.set('user-id', '1', {
		path: '/',
		maxAge: 2592000,
	});

	return {
		body: JSON.stringify({
			ok: true,
			user: 1,
		}),
	};
};
