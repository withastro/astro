

export function onRequest(ctx, next) {
	ctx.locals = {
		localsPattern: ctx.routePattern
	};
	return next()
}
