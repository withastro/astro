export const onRequest = async (context, next) => {
	if (context.url.pathname === '/rewrite-me/') {
		return context.rewrite('/alpha/');
	}
	return next();
};
