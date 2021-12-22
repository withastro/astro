import type { AstroConfig, ComponentInstance, GetStaticPathsResult, ManifestData, RouteCache, RouteData, RSSResult } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger';
import type { ViteDevServer } from '../vite.js';

import { fileURLToPath } from 'url';
import * as colors from 'kleur/colors';
import { debug } from '../logger.js';
import { preload as ssrPreload } from '../ssr/index.js';
import { validateGetStaticPathsModule, validateGetStaticPathsResult } from '../ssr/routing.js';
import { generatePaginateFunction } from '../ssr/paginate.js';
import { generateRssFunction } from '../ssr/rss.js';

export interface CollectPagesDataOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
	manifest: ManifestData;
	origin: string;
	routeCache: RouteCache;
	viteServer: ViteDevServer;
}

export interface CollectPagesDataResult {
	assets: Record<string, string>;
	allPages: AllPagesData;
}

// Examines the routes and returns a collection of information about each page.
export async function collectPagesData(opts: CollectPagesDataOptions): Promise<CollectPagesDataResult> {
	const { astroConfig, logging, manifest, origin, routeCache, viteServer } = opts;

	const assets: Record<string, string> = {};
	const allPages: AllPagesData = {};

	// Collect all routes ahead-of-time, before we start the build.
	// NOTE: This enforces that `getStaticPaths()` is only called once per route,
	// and is then cached across all future SSR builds. In the past, we've had trouble
	// with parallelized builds without guaranteeing that this is called first.
	await Promise.all(
		manifest.routes.map(async (route) => {
			// static route:
			if (route.pathname) {
				allPages[route.component] = {
					route,
					paths: [route.pathname],
					preload: await ssrPreload({
						astroConfig,
						filePath: new URL(`./${route.component}`, astroConfig.projectRoot),
						logging,
						mode: 'production',
						origin,
						pathname: route.pathname,
						route,
						routeCache,
						viteServer,
					})
						.then((routes) => {
							const html = `${route.pathname}`.replace(/\/?$/, '/index.html');
							debug(logging, 'build', `├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.yellow(html)}`);
							return routes;
						})
						.catch((err) => {
							debug(logging, 'build', `├── ${colors.bold(colors.red('✘'))} ${route.component}`);
							throw err;
						}),
				};
				return;
			}
			// dynamic route:
			const result = await getStaticPathsForRoute(opts, route)
				.then((routes) => {
					const label = routes.paths.length === 1 ? 'page' : 'pages';
					debug(logging, 'build', `├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.magenta(`[${routes.paths.length} ${label}]`)}`);
					return routes;
				})
				.catch((err) => {
					debug(logging, 'build', `├── ${colors.bold(colors.red('✗'))} ${route.component}`);
					throw err;
				});
			if (result.rss?.xml) {
				const rssFile = new URL(result.rss.url.replace(/^\/?/, './'), astroConfig.dist);
				if (assets[fileURLToPath(rssFile)]) {
					throw new Error(`[getStaticPaths] RSS feed ${result.rss.url} already exists.\nUse \`rss(data, {url: '...'})\` to choose a unique, custom URL. (${route.component})`);
				}
				assets[fileURLToPath(rssFile)] = result.rss.xml;
			}
			allPages[route.component] = {
				route,
				paths: result.paths,
				preload: await ssrPreload({
					astroConfig,
					filePath: new URL(`./${route.component}`, astroConfig.projectRoot),
					logging,
					mode: 'production',
					origin,
					pathname: result.paths[0],
					route,
					routeCache,
					viteServer,
				}),
			};
		})
	);

	return { assets, allPages };
}

async function getStaticPathsForRoute(opts: CollectPagesDataOptions, route: RouteData): Promise<{ paths: string[]; rss?: RSSResult }> {
	const { astroConfig, logging, routeCache, viteServer } = opts;
	if (!viteServer) throw new Error(`vite.createServer() not called!`);
	const filePath = new URL(`./${route.component}`, astroConfig.projectRoot);
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
	validateGetStaticPathsModule(mod);
	const rss = generateRssFunction(astroConfig.buildOptions.site, route);
	const staticPaths: GetStaticPathsResult = (await mod.getStaticPaths!({ paginate: generatePaginateFunction(route), rss: rss.generator })).flat();
	routeCache[route.component] = staticPaths;
	validateGetStaticPathsResult(staticPaths, logging);
	return {
		paths: staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean),
		rss: rss.rss,
	};
}
