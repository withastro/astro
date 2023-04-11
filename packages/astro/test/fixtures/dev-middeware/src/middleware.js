/** @type import("astro").AstroMiddlewareHandler */
const onRequest = async (context, resolve) => {
	console.log('calling on request');
	context.locals.foo = 'bar';
};

export { onRequest };
