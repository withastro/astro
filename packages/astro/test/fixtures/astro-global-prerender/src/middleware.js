

export function onRequest(ctx, next) {
	ctx.locals = {
		localsPrerender: ctx.prerender
	};
	return next()
}
