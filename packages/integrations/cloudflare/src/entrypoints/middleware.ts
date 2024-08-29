import { When, whenAmI } from '@it-astro:when';
import type { MiddlewareHandler } from 'astro';

const middlewares: Record<When, MiddlewareHandler> = {
	[When.Client]: () => {
		throw new Error('Client should not run a middleware!');
	},
	[When.DevServer]: (_, next) => next(),
	[When.Server]: (_, next) => next(),
	[When.Prerender]: (ctx, next) => {
		// @ts-expect-error
		if (ctx.locals.runtime === undefined) {
			// @ts-expect-error
			ctx.locals.runtime = {
				env: process.env,
			};
		}
		return next();
	},
	[When.StaticBuild]: (_, next) => next(),
};

export const onRequest = middlewares[whenAmI];
