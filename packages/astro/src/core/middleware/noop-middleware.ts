import type { MiddlewareHandler } from '../../@types/astro.js';
import { NOOP_MIDDLEWARE_HEADER } from '../constants.js';

export const NOOP_MIDDLEWARE_FN: MiddlewareHandler = (ctx, next) => {
	ctx.request.headers.set(NOOP_MIDDLEWARE_HEADER, 'true');
	return next();
};
