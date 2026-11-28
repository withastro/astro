import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	const user = context.cookies.get('user')?.value;
	if (user) context.locals.user = user;
	context.cookies.set('seen', 'yes');
	return next();
});
