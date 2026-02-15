import type { AstroPrerenderer, PathWithRoute } from '../../types/public/integrations.js';
import { invariant } from '../util/invariant.js';
import type { BuildInternals } from './internal.js';
import type { BuildApp } from './app.js';
import type { StaticBuildOptions } from './types.js';
import { resolveBuildConcurrency } from './concurrency.js';
import { PrerenderWorkerPool } from './prerender-worker-pool.js';
import type { WorkerBuildOptions } from './prerender-worker-messages.js';
import { mergeSerializedAssets } from './prerender-assets.js';
import { getRouteCacheKey } from '../render/route-cache.js';
import type { RouteData } from '../../types/public/internal.js';

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
	let workerPool: PrerenderWorkerPool | undefined;
	let workerOptions: WorkerBuildOptions | undefined;
	let prerenderEntryUrl: string | undefined;
	let routeKeyMap: Map<string, RouteData> | undefined;
	let workersInitialized = false;

	const prerenderer: DefaultPrerenderer = {
		name: 'astro:default',

		async setup() {
			// Import the prerender entry bundle
			const prerenderEntryFileName = internals.prerenderEntryFileName;
			invariant(
				prerenderEntryFileName,
				'Prerender entry filename not found in build internals. This is likely a bug in Astro.',
			);
			const prerenderEntry = new URL(prerenderEntryFileName, prerenderOutputDir);
			prerenderEntryUrl = prerenderEntry.toString();

			// Create app instance for asset generation
			const prerenderModule = await import(prerenderEntryUrl);
			const app = prerenderModule.app as BuildApp;
			app.setInternals(internals);
			app.setOptions(options);
			prerenderer.app = app;

			const concurrency = resolveBuildConcurrency(options.settings.config.build.concurrency);
			workerPool = new PrerenderWorkerPool(concurrency);
			workerOptions = {
				settings: {
					scripts: options.settings.scripts,
				},
				routesList: options.routesList,
				runtimeMode: options.runtimeMode,
				origin: options.origin,
				logLevel: options.logger.options.level,
			};
			routeKeyMap = new Map(
				options.routesList.routes.map((route) => [getRouteCacheKey(route), route]),
			);
			// Initialize the first worker to gather static paths and seed the route cache.
			await workerPool.initWorker(0, {
				prerenderEntryUrl,
				internals,
				options: workerOptions,
			});
		},

		async getStaticPaths(): Promise<PathWithRoute[]> {
			invariant(
				workerPool && workerOptions && prerenderEntryUrl,
				'Prerender worker pool not initialized.',
			);
			const result = await workerPool.getStaticPaths();
			if (!workersInitialized) {
				await workerPool.initRemainingWorkers({
					prerenderEntryUrl,
					internals,
					options: workerOptions,
					routeCache: result.routeCache,
				});
				workersInitialized = true;
			}
			invariant(routeKeyMap, 'Route key map not initialized.');
			return result.paths.map(({ pathname, routeKey }) => {
				const route = routeKeyMap!.get(routeKey);
				invariant(route, `Unknown route key: ${routeKey}`);
				return { pathname, route };
			});
		},

		async render(request, { routeData }) {
			invariant(workerPool, 'Prerender worker pool not initialized.');
			const routeKey = getRouteCacheKey(routeData);
			const result = await workerPool.render({
				url: request.url,
				routeKey,
			});
			mergeSerializedAssets(result.assets);
			const responseBody = result.body ? Buffer.from(result.body) : null;
			return new Response(responseBody, {
				status: result.status,
				headers: result.headers,
			});
		},

		async teardown() {
			await workerPool?.close();
		},
	};

	return prerenderer;
}
