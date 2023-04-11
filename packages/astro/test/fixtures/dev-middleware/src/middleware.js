import { sequence } from 'astro/middleware';

/** @type import("astro").AstroMiddlewareHandler */
const first = async (context, resolve) => {
	if (context.request.url.endsWith('/lorem')) {
		context.locals.name = 'ipsum';
	} else {
		context.locals.name = 'bar';
	}
	return await resolve(context);
};

/** @type import("astro").AstroMiddlewareHandler */
const second = async (context, resolve) => {
	if (context.request.url.endsWith('/second')) {
		context.locals.name = 'second';
	}
};

export const onRequest = sequence(first, second);
