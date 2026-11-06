import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (ctx, next) => {
	const url = new URL(ctx.request.url);
	
	if (url.pathname.includes("/mid/to-redirect")) {
		return ctx.redirect("/mid/from-redirect");
	}
	if (url.pathname.includes("/mid/to-rewrite")) {
		return ctx.rewrite("/mid/from-rewrite");
	}
	
	
	ctx.locals.getGreeting = () => {
			return `Hello from ${url.pathname}`;
	};
	
	return next()
})
