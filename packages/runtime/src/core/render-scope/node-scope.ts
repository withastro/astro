import { AsyncLocalStorage } from 'node:async_hooks';
import { installRenderScope } from './scope.js';
import type { RenderCollectors, RenderCollectorScope } from './scope.js';

/**
 * Installs (first-wins) an AsyncLocalStorage-backed render scope and returns
 * the installed scope.
 *
 * This module is the ONE static `node:async_hooks` import in core and must only
 * be imported by Node-only build code in `core/build/` — never by code that is
 * bundled into prerender, server, or adapter output.
 */
export function ensureAsyncRenderScope(): RenderCollectorScope {
	return installRenderScope(new AsyncLocalStorage<RenderCollectors>());
}
