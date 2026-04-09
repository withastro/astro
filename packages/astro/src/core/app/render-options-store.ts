import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request render options passed from BaseApp.render() into the Hono
 * middleware pipeline. Using AsyncLocalStorage avoids smuggling values on
 * the Request object (which breaks when Requests are cloned for rewrites).
 *
 * The store is attached to a global Symbol so that the same instance is
 * shared even when the module is duplicated across bundles (e.g. the
 * adapter's runtime App import vs. the bundled fixture/server code).
 */
interface RenderOptions {
	locals?: App.Locals;
	clientAddress?: string;
	addCookieHeader?: boolean;
}

const key = Symbol.for('astro.renderOptionsStore');
const g = globalThis as Record<symbol, unknown>;
export const renderOptionsStore: AsyncLocalStorage<RenderOptions> =
	(g[key] as AsyncLocalStorage<RenderOptions>) ?? (g[key] = new AsyncLocalStorage<RenderOptions>());
