export function onRequest(context, next) {
	context.locals.user = 'astro-middleware';
	return next();
}
