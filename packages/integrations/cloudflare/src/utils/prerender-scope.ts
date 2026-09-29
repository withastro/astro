import { installRenderScope, type BaseApp, type StaticImageConfig } from 'astro/app';

let warned = false;

export async function ensurePrerenderScope(
	logger: BaseApp['logger'],
	staticImages: StaticImageConfig | undefined,
): Promise<void> {
	let AsyncLocalStorage: typeof import('node:async_hooks').AsyncLocalStorage | undefined;
	// Dynamic import as a probe: the worker may lack the `nodejs_als` flag.
	try {
		({ AsyncLocalStorage } = await import('node:async_hooks'));
	} catch {
		if (!warned) {
			warned = true;
			logger.warn(
				'build',
				'AsyncLocalStorage is unavailable in this worker, so incremental builds will re-render every prerendered page. Enable the nodejs_als or nodejs_compat compatibility flag.',
			);
		}
	}
	installRenderScope(AsyncLocalStorage ? new AsyncLocalStorage() : undefined, { staticImages });
}
