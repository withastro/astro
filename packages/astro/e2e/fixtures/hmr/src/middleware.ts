import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((_context, next) => {
	const response = next();
	response.then((res) => {
		res.headers.set('x-test-middleware', 'before');
	});
	return response;
});
