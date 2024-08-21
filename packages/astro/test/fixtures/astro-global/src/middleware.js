

export function onRequest(ctx, next) {
	ctx.locals = {
		localsPattern: ctx.route.pattern
	};
	return next()
}
