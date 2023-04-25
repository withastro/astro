import { sequence, defineMiddleware } from 'astro/middleware';

const first = defineMiddleware(async (context, next) => {
	if (context.request.url.endsWith('/lorem')) {
		context.locals.name = 'ipsum';
	} else if (context.request.url.endsWith('/rewrite')) {
		return new Response('<span>New content!!</span>', {
			status: 200,
		});
	} else if (context.request.url.endsWith('/broken')) {
		return new Response(null, {
			status: 500,
		});
	} else {
		context.locals.name = 'bar';
	}
	return await next();
});

const second = defineMiddleware(async (context, next) => {
	if (context.request.url.endsWith('/second')) {
		context.locals.name = 'second';
	} else if (context.request.url.endsWith('/redirect')) {
		return context.redirect('/', 302);
	}
	return await next();
});

const third = defineMiddleware(async (context, next) => {
	if (context.request.url.endsWith('/broken-locals')) {
		context.locals = {
			fn() {},
		};
	} else if (context.request.url.endsWith('/does-nothing')) {
		return undefined;
	}
	next();
});

export const onRequest = sequence(first, second, third);
