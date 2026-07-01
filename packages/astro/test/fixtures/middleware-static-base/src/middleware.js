import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname === '/test/private' && !context.cookies.get('auth')?.value) {
		return context.redirect('/login');
	}

	const response = await next();
	if (context.url.pathname === '/test/about' || context.url.pathname === '/test/fr/about') {
		response.headers.set('x-middleware-static', 'true');
	}
	return response;
});
