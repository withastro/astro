import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request render options passed from BaseApp.render() into the Hono
 * middleware pipeline. Using AsyncLocalStorage avoids smuggling values on
 * the Request object (which breaks when Requests are cloned for rewrites).
 */
export interface RenderOptions {
	locals?: App.Locals;
	clientAddress?: string;
	addCookieHeader?: boolean;
}

export const renderOptionsStore = new AsyncLocalStorage<RenderOptions>();
