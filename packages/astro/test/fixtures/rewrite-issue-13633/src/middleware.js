export const onRequest = async (ctx, next) => {
	const response = await next('/');
	return response;
};
