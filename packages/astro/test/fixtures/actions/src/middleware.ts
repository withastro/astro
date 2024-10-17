import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((ctx, next) => {
	ctx.locals.user = {
		name: 'Houston',
	};
	return next();
});
