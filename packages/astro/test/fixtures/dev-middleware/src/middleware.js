import { sequence } from 'astro/middleware';

/** @type import("astro").MiddlewareResponseHandler */
const first = async (context, next) => {
	if (context.request.url.endsWith('/lorem')) {
		context.locals.name = 'ipsum';
	} else if (context.request.url.endsWith('/rewrite')) {
		const response = await next();
		return new Response('<span>New content!!</span>', {
			status: 200,
			headers: response.headers,
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
		// before a redirect, we need to resolve the response
		await next();
		return context.redirect('/', 302);
	}
	return await next();
};

export const onRequest = sequence(first, second);
