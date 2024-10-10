import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((ctx, next) => {
	if (ctx.request.method === "GET" && ctx.url.pathname === "/sum") {
		return next("/rewritten")
	}
	
	return next()
})
