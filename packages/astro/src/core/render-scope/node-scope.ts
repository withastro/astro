import { AsyncLocalStorage } from 'node:async_hooks';
import { installRenderScope } from './scope.js';
import type { RenderCollectors, RenderCollectorScope, RenderScopeOptions } from './scope.js';

/**
 * Installs (first-wins) an AsyncLocalStorage-backed render scope and returns
 * the installed scope.
 *
 * This module is the ONE static `node:async_hooks` import in core and must be
 * imported ONLY by orchestrator-only build code (`core/build/generate.ts`)
 * that is never bundled into prerender, server, or adapter output.
 */
export function ensureAsyncRenderScope(options?: RenderScopeOptions): RenderCollectorScope {
	return installRenderScope(new AsyncLocalStorage<RenderCollectors>(), options)!;
}
