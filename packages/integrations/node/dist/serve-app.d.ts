import type { BaseApp } from 'astro/app';
import type { Options, RequestHandler } from './types.js';
/**
 * Creates a Node.js http listener for on-demand rendered pages, compatible with http.createServer and Connect middleware.
 * If the next callback is provided, it will be called if the request does not have a matching route.
 * Intended to be used in both standalone and middleware mode.
 */
export declare function createAppHandler(app: BaseApp, options: Options): RequestHandler;
