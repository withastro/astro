import { installRenderScope, type BaseApp } from 'astro/app';

/**
 * Installs the AsyncLocalStorage-backed render scope for the workerd prerender
 * worker, so each concurrent prerender request collects its incremental
 * metadata in its own per-render store.
 *
 * This module is prerender-only: it is loaded via a dynamic import behind the
 * compile-time `isPrerender` const (see `handler.ts`), so its `node:` reference
 * never reaches production worker bundles. `node:async_hooks` itself is
 * imported dynamically as a runtime probe: the prerender worker gets the
 * `nodejs_als` compatibility flag auto-appended by the adapter when no
 * ALS-capable flag is configured, but if AsyncLocalStorage is still unavailable
 * we warn once and install nothing — collection then degrades to "not tracked"
 * (`metadata: undefined`), never wrong attribution.
 *
 * `installRenderScope` is first-wins, so calling this per request is
 * idempotent.
 */

let warned = false;

export async function ensurePrerenderScope(logger: BaseApp['logger']): Promise<void> {
	try {
		const { AsyncLocalStorage } = await import('node:async_hooks');
		installRenderScope(new AsyncLocalStorage());
	} catch {
		if (!warned) {
			warned = true;
			logger.warn(
				'build',
				'AsyncLocalStorage is unavailable in this worker; incremental metadata will not be collected for prerendered paths. Enable the nodejs_als or nodejs_compat compatibility flag.',
			);
		}
	}
}
