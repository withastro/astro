import type { AstroPrerenderer } from '../../types/public/integrations.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';
import type { BuildApp } from './app.js';
import { renderForPrerender } from '../app/prerender.js';
import { StaticPaths } from '../../runtime/prerender/static-paths.js';

interface DefaultPrerendererOptions {
	internals: BuildInternals;
	options: StaticBuildOptions;
	prerenderOutputDir: URL;
}

/**
 * Default prerenderer with access to the BuildApp for assets generation.
 */
export interface DefaultPrerenderer extends AstroPrerenderer {
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

			// Configure the app
			app.setInternals(internals);
			app.setOptions(options);
			// A later build in the same process with identical output reuses the cached
			// prerender module, and with it the route cache. Recompute static paths, so
			// `getStaticPaths()` sees fresh data and its images are collected again.
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
