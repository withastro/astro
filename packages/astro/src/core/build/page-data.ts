import type { ViteDevServer } from 'vite';
import type { AstroConfig, ComponentInstance, ManifestData, RouteData } from '../../@types/astro';
import type { LogOptions } from '../logger/core';
import { info } from '../logger/core.js';
import type { AllPagesData } from './types';

import * as colors from 'kleur/colors';
import { fileURLToPath } from 'url';
import { debug } from '../logger/core.js';
import { removeTrailingForwardSlash } from '../path.js';
import { preload as ssrPreload } from '../render/dev/index.js';
import { callGetStaticPaths, RouteCache, RouteCacheEntry } from '../render/route-cache.js';
import { matchRoute } from '../routing/match.js';
import { isBuildingToSSR } from '../util.js';

export interface CollectPagesDataOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
	manifest: ManifestData;
	origin: string;
	routeCache: RouteCache;
	viteServer: ViteDevServer;
	ssr: boolean;
}

export interface CollectPagesDataResult {
	assets: Record<string, string>;
	allPages: AllPagesData;
}

// Examines the routes and returns a collection of information about each page.
export async function collectPagesData(
	opts: CollectPagesDataOptions
): Promise<CollectPagesDataResult> {
	const { astroConfig, logging, manifest, origin, routeCache, viteServer } = opts;

	const assets: Record<string, string> = {};
	const allPages: AllPagesData = {};
	const builtPaths = new Set<string>();

	const buildMode = isBuildingToSSR(astroConfig) ? 'ssr' : 'static';

	const dataCollectionLogTimeout = setInterval(() => {
		info(opts.logging, 'build', 'The data collection step may take longer for larger projects...');
		clearInterval(dataCollectionLogTimeout);
	}, 30000);

	// Collect all routes ahead-of-time, before we start the build.
	// NOTE: This enforces that `getStaticPaths()` is only called once per route,
	// and is then cached across all future SSR builds. In the past, we've had trouble
	// with parallelized builds without guaranteeing that this is called first.
	for (const route of manifest.routes) {
		// static route:
		if (route.pathname) {
			const routeCollectionLogTimeout = setInterval(() => {
				info(
					opts.logging,
					'build',
					`${colors.bold(
						route.component
					)} is taking a bit longer to import. This is common for larger "Astro.glob(...)" or "import.meta.globEager(...)" calls, for instance. Hang tight!`
				);
				clearInterval(routeCollectionLogTimeout);
			}, 10000);
			builtPaths.add(route.pathname);
			allPages[route.component] = {
				component: route.component,
				route,
				paths: [route.pathname],
				moduleSpecifier: '',
				css: new Set(),
				hoistedScript: undefined,
				scripts: new Set(),
			};

			clearInterval(routeCollectionLogTimeout);
			if (buildMode === 'static') {
				const html = `${route.pathname}`.replace(/\/?$/, '/index.html');
				debug(
					'build',
					`├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.yellow(html)}`
				);
			} else {
				debug('build', `├── ${colors.bold(colors.green('✔'))} ${route.component}`);
			}
			continue;
		}
		// dynamic route:
		const result = await getStaticPathsForRoute(opts, route)
			.then((_result) => {
				const label = _result.staticPaths.length === 1 ? 'page' : 'pages';
				debug(
					'build',
					`├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.magenta(
						`[${_result.staticPaths.length} ${label}]`
					)}`
				);
				return _result;
			})
			.catch((err) => {
				debug('build', `├── ${colors.bold(colors.red('✗'))} ${route.component}`);
				throw err;
			});
		const finalPaths = result.staticPaths
			.map((staticPath) => staticPath.params && route.generate(staticPath.params))
			.filter((staticPath) => {
				// Remove empty or undefined paths
				if (!staticPath) {
					return false;
				}

				// The path hasn't been built yet, include it
				if (!builtPaths.has(removeTrailingForwardSlash(staticPath))) {
					return true;
				}

				// The path was already built once. Check the manifest to see if
				// this route takes priority for the final URL.
				// NOTE: The same URL may match multiple routes in the manifest.
				// Routing priority needs to be verified here for any duplicate
				// paths to ensure routing priority rules are enforced in the final build.
				const matchedRoute = matchRoute(staticPath, manifest);
				return matchedRoute === route;
			});

		finalPaths.map((staticPath) => builtPaths.add(removeTrailingForwardSlash(staticPath)));

		allPages[route.component] = {
			component: route.component,
			route,
			paths: finalPaths,
			moduleSpecifier: '',
			css: new Set(),
			hoistedScript: undefined,
			scripts: new Set()
		};
	}

	clearInterval(dataCollectionLogTimeout);

	return { assets, allPages };
}

async function getStaticPathsForRoute(
	opts: CollectPagesDataOptions,
	route: RouteData
): Promise<RouteCacheEntry> {
	const { astroConfig, logging, routeCache, ssr, viteServer } = opts;
	if (!viteServer) throw new Error(`vite.createServer() not called!`);
	const filePath = new URL(`./${route.component}`, astroConfig.root);
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
	const result = await callGetStaticPaths({ mod, route, isValidate: false, logging, ssr });
	routeCache.set(route, result);
	return result;
}
