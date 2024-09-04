

export function onRequest(ctx, next) {
	ctx.locals = {
		localsPrerender: ctx.isPrerendered
	};
	return next()
}
