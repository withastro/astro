import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	if (context.url.pathname === '/integration-post') {
		return new Response(JSON.stringify({ post: 'works' }), {
			headers: {
				'content-type': 'application/json',
			},
		});
	}
	
	if (context.url.pathname === '/does-not-exist') {
		return context.rewrite('/rewrite');
	}

	return next();
});
