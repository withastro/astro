export const onRequest = (context, next) => {
	context.locals.title = 'Middleware';

	return next();
};
