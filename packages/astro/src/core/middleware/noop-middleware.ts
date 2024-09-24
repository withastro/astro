import type { MiddlewareHandler } from '../../types/public/common.js';

export const NOOP_MIDDLEWARE_FN: MiddlewareHandler = (_, next) => next();
