import { When, whenAmI } from '@it-astro:when';
import type { MiddlewareHandler } from 'astro';

const middlewares: Record<any, MiddlewareHandler> = {
	[When.Prerender]: (ctx, next) => {
		if (ctx.locals.runtime === undefined) {
			ctx.locals.runtime = {
				env: process.env,
			};
		}
		return next();
	},
};

export const onRequest = middlewares[whenAmI];
