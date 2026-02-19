import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(({ isPrerendered }, next) => {
	if (!isPrerendered) {
		throw new Error('This middleware should only run in prerendered mode.');
	}
	return next();
});
