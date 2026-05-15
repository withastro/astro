import type { MiddlewareHandler } from '../../types/public/common.js';
/**
 * Returns a middleware function in charge to check the `origin` header.
 *
 * @private
 */
export declare function createOriginCheckMiddleware(): MiddlewareHandler;
export declare function hasFormLikeHeader(contentType: string | null): boolean;
