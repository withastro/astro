import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	console.info('[MIDDLEWARE] in ' + context.url.toString());
	return next();
});
