/**
 * Reads the response before returning it: `next()` has to hand one back.
 *
 * @type {import("astro").MiddlewareResponseHandler}
 */
export const onRequest = async (_context, next) => {
	const response = await next();
	response.headers.set('x-astro-middleware', 'ran');
	return response;
};
