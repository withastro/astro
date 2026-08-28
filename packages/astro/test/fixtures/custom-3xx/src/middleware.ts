import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	if (context.url.pathname === '/middleware' || context.url.pathname === '/middleware/') {
		return context.redirect('/target?source=middleware', 303);
	}
	if (context.url.pathname === '/rewrite-internal') {
		return context.rewrite('/3xx');
	}
	if (context.url.pathname === '/rewrite-redirect') {
		return context.rewrite('/page-redirect');
	}
	return next();
});
