import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
	ctx.cookies.set('sid', 'abc');
	return next();
});
