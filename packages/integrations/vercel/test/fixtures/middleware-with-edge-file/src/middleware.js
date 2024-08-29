/**
 * @type {import("astro").MiddlewareResponseHandler}
 */
export const onRequest = async (context, next) => {
	const test = 'something';
	context.cookies.set('foo', 'bar');
	const response = await next();
	return response;
};
