export const onRequest = async (_ctx, next) => {
	const response = await next('/');
	console.info('expected response.status is', response.status);
	return response;
};
