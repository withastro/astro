import { sequence, defineMiddleware } from 'astro/middleware';

const middleware1 = defineMiddleware((_, next) => next('/'));

const middleware2 = defineMiddleware(async ({ request }, next) => {
	console.log(await request.clone().text());
	return next();
});

const middleware3 = defineMiddleware(async ({ request }, next) => {
	await request.clone();
	return next();
});

export const onRequest = sequence(middleware1, middleware2, middleware3);