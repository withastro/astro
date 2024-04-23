import { sequence } from 'astro:middleware';

export const first = async (context, next) => {
	if (context.url.pathname.includes('/auth')) {
	}

	return next();
};

export const second = async (context, next) => {
	if (context.url.pathname.includes('/auth')) {
		if (context.url.pathname.includes('/auth/dashboard')) {
			return await context.reroute('/');
		}
		if (context.url.pathname.includes('/auth/base')) {
			return await next('/');
		}
	}
	return next();
};

export const third = async (context, next) => {
	if (context.url.pathname.startsWith('/')) {
		context.locals.auth = 'Third function called';
	}
	return next();
};

export const onRequest = sequence(first, second, third);
