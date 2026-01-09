import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = (context, next) => {
	if (context.isPrerendered) {
		// @ts-expect-error
		context.locals.runtime ??= {
			env: process.env,
		};
	}

	return next();
};
