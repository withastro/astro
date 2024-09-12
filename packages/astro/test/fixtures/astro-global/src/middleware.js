

export function onRequest(ctx, next) {
	ctx.locals = {
		localsPattern: ctx.routePattern,
		localsPrerendered: ctx.isPrerendered
	};
	return next()
}
