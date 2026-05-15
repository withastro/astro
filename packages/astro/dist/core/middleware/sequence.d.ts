import type { MiddlewareHandler } from '../../types/public/common.js';
/**
 *
 * It accepts one or more middleware handlers and makes sure that they are run in sequence.
 */
export declare function sequence(...handlers: MiddlewareHandler[]): MiddlewareHandler;
