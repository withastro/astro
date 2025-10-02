import { sequence, defineMiddleware } from 'astro/middleware';

const middleware1 = defineMiddleware((_, next) => next('/'));

const middleware2 = defineMiddleware(async ({ request, cookies }, next) => {
	cookies.set('cookie1', 'Cookie from middleware 1');
	console.log(await request.clone().text());
	return next();
});

const middleware3 = defineMiddleware(async ({ request, cookies }, next) => {
	cookies.set('cookie2', 'Cookie from middleware 2');
	await request.clone();
	return next();
});

export const onRequest = sequence(middleware1, middleware2, middleware3);
