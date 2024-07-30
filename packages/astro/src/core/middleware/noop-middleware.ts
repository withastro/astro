import type { MiddlewareHandler } from '../../@types/astro.js';

export const NOOP_MIDDLEWARE_FN: MiddlewareHandler = (_, next) => next();
