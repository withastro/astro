import { sequence } from 'astro/middleware';

/** @type import("astro").MiddlewareResponseHandler */
const first = async (context, next) => {
	if (context.request.url.endsWith('/lorem')) {
		context.locals.name = 'ipsum';
	} else if (context.request.url.endsWith('/rewrite')) {
		return new Response('<span>New content!!</span>', {
			status: 200,
		});
	} else {
		context.locals.name = 'bar';
	}
	return await next();
};

/** @type import("astro").MiddlewareResponseHandler */
const second = async (context, next) => {
	if (context.request.url.endsWith('/second')) {
		context.locals.name = 'second';
	} else if (context.request.url.endsWith('/redirect')) {
		return context.redirect('/', 302);
	}
	return await next();
};

export const onRequest = sequence(first, second);
