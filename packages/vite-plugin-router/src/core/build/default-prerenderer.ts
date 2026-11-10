import type { Prerenderer } from '../../index.js';
import type { BuildInternals } from '../../internal/core/build/internal.js';
import type { StaticBuildOptions } from '../../internal/core/build/types.js';
import type { BuildApp } from './app.js';
import { renderForPrerender } from '../../internal/core/app/prerender.js';
import { StaticPaths } from '../../internal/runtime/prerender/static-paths.js';

interface DefaultPrerendererOptions {
	internals: BuildInternals;
	options: StaticBuildOptions;
	prerenderOutputDir: URL;
}

/**
 * Default prerenderer with access to the BuildApp for assets generation.
 */
export interface DefaultPrerenderer extends Prerenderer {
	/** The BuildApp instance, available after setup() is called */
	app?: BuildApp;
}

/**
 * Creates the default prerenderer that uses Node to import the bundle and render pages.
 * This is used when no custom prerenderer is set by an adapter.
 */
export function createDefaultPrerenderer({
	internals,
	options,
	prerenderOutputDir,
}: DefaultPrerendererOptions): DefaultPrerenderer {
	const prerenderer: DefaultPrerenderer = {
		name: 'astro:default',

		async setup() {
			// Import the prerender entry bundle
			const prerenderEntryFileName = internals.prerenderEntryFileName;
			if (!prerenderEntryFileName) {
				throw new Error(
					`Prerender entry filename not found in build internals. This is likely a bug in Astro.`,
				);
			}
			const prerenderEntryUrl = new URL(prerenderEntryFileName, prerenderOutputDir);
			const { app }: { app: BuildApp } = await import(prerenderEntryUrl.toString());

			app.setInternals({
				...internals,
				pageScripts: internals.routerRegistry!.getPageScripts('build'),
			});
			app.setOptions({
				headInlineScripts: options.host.headInlineScripts,
				redirectPage: options.host.redirectPage,
				logger: options.logger,
			});
			// Rebuilds in one process reuse the cached module, and its stale static paths.
			app.routeCache.clearAll();
			prerenderer.app = app;
		},

		async getStaticPaths() {
			const staticPaths = new StaticPaths(prerenderer.app!);
			return staticPaths.getAllWithMetadata();
		},

		async render(request, { routeData }) {
			return renderForPrerender(prerenderer.app!, request, { routeData });
		},

		async teardown() {
			// No cleanup needed for default prerenderer
		},
	};

	return prerenderer;
}
