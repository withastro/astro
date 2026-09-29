import { installRenderScope, type BaseApp, type StaticImageConfig } from 'astro/app';

/**
 * Installs the AsyncLocalStorage-backed render scope for the workerd prerender
 * worker, so each concurrent prerender request collects its metadata in its
 * own per-render store. With `staticImages`, `getImage()` resolves transforms
 * to files emitted at build time.
 *
 * This module is prerender-only: it is loaded via a dynamic import behind the
 * compile-time `isPrerender` const (see `handler.ts`), so its `node:` reference
 * never reaches production worker bundles. `node:async_hooks` itself is
 * imported dynamically as a runtime probe: the prerender worker gets the
 * `nodejs_als` compatibility flag auto-appended by the adapter when no
 * ALS-capable flag is configured, but if AsyncLocalStorage is still unavailable
 * we warn once and install the scope without it — collection then degrades to
 * "not tracked" (`metadata: undefined`), never wrong attribution, and image
 * records are only reported through the static images endpoint.
 *
 * `installRenderScope` is first-wins, so calling this per request is
 * idempotent.
 */

let warned = false;

export async function ensurePrerenderScope(
	logger: BaseApp['logger'],
	staticImages: StaticImageConfig | undefined,
): Promise<void> {
	let AsyncLocalStorage: typeof import('node:async_hooks').AsyncLocalStorage | undefined;
	try {
		({ AsyncLocalStorage } = await import('node:async_hooks'));
	} catch {
		if (!warned) {
			warned = true;
			logger.warn(
				'build',
				'AsyncLocalStorage is unavailable in this worker; incremental metadata will not be collected for prerendered paths. Enable the nodejs_als or nodejs_compat compatibility flag.',
			);
		}
	}
	installRenderScope(AsyncLocalStorage ? new AsyncLocalStorage() : undefined, { staticImages });
}
