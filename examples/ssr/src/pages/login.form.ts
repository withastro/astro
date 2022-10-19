import { APIContext } from 'astro';

export function post({ cookies, params, request }: APIContext) {
	// add a new cookie
	cookies.set('user-id', '1', {
		path: '/',
		maxAge: 2592000,
	});

	return new Response(null, {
		status: 301,
		headers: {
			Location: '/',
		},
	});
}
