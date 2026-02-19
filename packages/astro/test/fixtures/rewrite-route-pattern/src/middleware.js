import { defineMiddleware, sequence } from 'astro:middleware';

export const first = defineMiddleware(async (context, next)=> {
	if (context.url.pathname === '/index2') {
		return next('/123/post')
	} else {
		
		return next(`/destination`);
	}
});

export const second = defineMiddleware(async (context, next)=> {
	context.locals.pattern = context.routePattern;
	return next();
});

export const onRequest = sequence(first, second);
