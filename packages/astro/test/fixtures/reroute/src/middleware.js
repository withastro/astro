import { sequence } from 'astro:middleware';

let contextReroute = false;

export const first = async (context, next) => {
	if (context.url.pathname.includes('/auth')) {
	}

	return next();
};

export const second = async (context, next) => {
	if (context.url.pathname.includes('/auth')) {
		if (context.url.pathname.includes('/auth/dashboard')) {
			contextReroute = true;
			return await context.rewrite('/');
		}
		if (context.url.pathname.includes('/auth/base')) {
			return await next('/');
		}

		if (context.url.pathname.includes('/auth/params')) {
			return  next('/?foo=bar');
		}
	}
	return next();
};

export const third = async (context, next) => {
	// just making sure that we are testing the change in context coming from `next()`
	if (context.url.pathname.startsWith('/') && contextReroute === false) {
		context.locals.auth = 'Third function called';
	}
	return next();
};

export const onRequest = sequence(first, second, third);
