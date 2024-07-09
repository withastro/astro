import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((ctx, next) => {
	console.log('###middleware', ctx.cookies.get('subscribed', {path: '/'}));
	ctx.locals.user = {
		name: 'Houston',
	};
	return next();
});
