import { AsyncLocalStorage } from 'node:async_hooks';
import { installRenderScope } from 'astro/app';

/**
 * Installs the AsyncLocalStorage-backed render scope for the workerd prerender
 * worker, so each concurrent prerender request collects its metadata (content
 * entries, images) in its own per-render store.
 *
 * This module is prerender-only: it is loaded via a dynamic import behind the
 * compile-time `isPrerender` const (see `handler.ts`), so its `node:` import
 * never reaches production worker bundles. AsyncLocalStorage is always
 * available here, because the adapter appends the `nodejs_als` compatibility
 * flag to the prerender worker when no ALS-capable flag is configured.
 *
 * `installRenderScope` is first-wins, so calling this per request is
 * idempotent.
 */
export function ensurePrerenderScope(): void {
	installRenderScope(new AsyncLocalStorage());
}
