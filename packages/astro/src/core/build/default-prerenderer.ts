import type { AstroPrerenderer } from '../../types/public/integrations.js';
import type { RouteData } from '../../types/public/internal.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';
import { BuildApp } from './app.js';
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
	// Track pathname→route mapping to avoid route priority issues with app.match()
	const pathnameToRoute = new Map<string, RouteData>();

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
			const prerenderEntry = await import(prerenderEntryUrl.toString());

			// Get the app and configure it
			const app = prerenderEntry.app as BuildApp;
			app.setInternals(internals);
			app.setOptions(options);
			prerenderer.app = app;
		},

		async getStaticPaths() {
			const staticPaths = new StaticPaths(prerenderer.app!);
			const pathsWithRoutes = await staticPaths.getAll();
			// Store pathname→route mapping for render()
			for (const { pathname, route } of pathsWithRoutes) {
				pathnameToRoute.set(pathname, route);
			}
			return pathsWithRoutes.map(p => p.pathname);
		},

		async render(request: Request) {
			// Get the route from our mapping (avoids route priority issues with app.match())
			// Fall back to app.match() for static routes that don't go through getStaticPaths
			// Normalize pathname by removing trailing slash and .html (URL has endings, map doesn't)
			let pathname = prerenderer.app!.getPathnameFromRequest(request);
			if (pathname.endsWith('/') && pathname !== '/') {
				pathname = pathname.slice(0, -1);
			} else if (pathname.endsWith('.html')) {
				pathname = pathname.slice(0, -5);
			}
			const routeData = pathnameToRoute.get(pathname) ?? prerenderer.app!.match(request, true);
			return prerenderer.app!.render(request, { routeData });
		},

		async teardown() {
			// No cleanup needed for default prerenderer
		},
	};

	return prerenderer;
}
