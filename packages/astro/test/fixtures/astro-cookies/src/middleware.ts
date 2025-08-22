import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((ctx, next) => {
	if (ctx.url.pathname === "/rewrite-me") {
		return next("/rewrite-target");
	} else {
		return next();
	}
})
