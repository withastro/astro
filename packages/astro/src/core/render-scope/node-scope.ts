import { AsyncLocalStorage } from 'node:async_hooks';
import { installRenderScope } from './scope.js';
import type { RenderCollectors, RenderCollectorScope } from './scope.js';

/**
 * Installs (first-wins) an AsyncLocalStorage-backed render scope and returns
 * the installed scope.
 *
 * This module is the ONE static `node:async_hooks` import in core and must be
 * imported ONLY by `core/build/generate.ts` — orchestrator-only
 * code that is never bundled into prerender, server, or adapter output.
 */
export function ensureAsyncRenderScope(): RenderCollectorScope {
	const scope = installRenderScope(new AsyncLocalStorage<RenderCollectors>());
	if (!scope) throw new Error('A render channel without a scope is already installed.');
	return scope;
}
