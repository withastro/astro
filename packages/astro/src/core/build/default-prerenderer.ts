import type { AstroPrerenderer, PathWithRoute } from '../../types/public/integrations.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';
import type { BuildApp } from './app.js';
import type { ImageService } from '../../assets/services/service.js';
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

interface PrerenderEntry {
	app: BuildApp;
	/** Missing from prerender entrypoints that don't re-export it. */
	getImageService?: () => Promise<ImageService>;
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
	let prerenderEntry: PrerenderEntry | undefined;
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
			prerenderEntry = (await import(prerenderEntryUrl.toString())) as PrerenderEntry;

			// Get the app and configure it
			const app = prerenderEntry.app as BuildApp;
			app.setInternals(internals);
			app.setOptions(options);
			prerenderer.app = app;
		},

		async getStaticPaths(): Promise<PathWithRoute[]> {
			const staticPaths = new StaticPaths(prerenderer.app!);
			return staticPaths.getAll();
		},

		async render(request, { routeData, collectMetadata }) {
			// The render scope is installed by the build (see `generate.ts`); records
			// originating in the bundled prerender runtime reach it through the
			// `Symbol.for('astro:render-scope')` channel.
			return renderForPrerender(prerenderer.app!, request, { routeData, collectMetadata });
		},

		async getImageService() {
			if (!prerenderEntry?.getImageService) {
				throw new Error(
					`The prerender entrypoint does not export \`getImageService\`. This is likely a bug in Astro.`,
				);
			}
			return prerenderEntry.getImageService();
		},

		async teardown() {
			// No cleanup needed for default prerenderer
		},
	};

	return prerenderer;
}
