import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname === '/build-phase') {
		return new Response('<p>build-phase:middleware</p>', {
			headers: {
				'content-type': 'text/html; charset=utf-8',
			},
		});
	}

	if (context.url.pathname === '/private' && !context.cookies.get('auth')?.value) {
		return context.redirect('/login');
	}

	const response = await next();
	if (context.url.pathname === '/about' || context.url.pathname === '/fr/about') {
		response.headers.set('x-middleware-static', 'true');
	}
	return response;
});
