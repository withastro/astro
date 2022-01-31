import type { AstroConfig, ComponentInstance, ManifestData, RouteData, RSSResult } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger';
import type { ViteDevServer } from '../vite.js';

import { fileURLToPath } from 'url';
import * as colors from 'kleur/colors';
import { debug } from '../logger.js';
import { preload as ssrPreload } from '../ssr/index.js';
import { generateRssFunction } from '../ssr/rss.js';
import { callGetStaticPaths, RouteCache, RouteCacheEntry } from '../ssr/route-cache.js';

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
							debug('build', `├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.yellow(html)}`);
							return routes;
						})
						.catch((err) => {
							debug('build', `├── ${colors.bold(colors.red('✘'))} ${route.component}`);
							throw err;
						}),
				};
				return;
			}
			// dynamic route:
			const result = await getStaticPathsForRoute(opts, route)
				.then((_result) => {
					const label = _result.staticPaths.length === 1 ? 'page' : 'pages';
					debug('build', `├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.magenta(`[${_result.staticPaths.length} ${label}]`)}`);
					return _result;
				})
				.catch((err) => {
					debug('build', `├── ${colors.bold(colors.red('✗'))} ${route.component}`);
					throw err;
				});
			const rssFn = generateRssFunction(astroConfig.buildOptions.site, route);
			for (const rssCallArg of result.rss) {
				const rssResult = rssFn(rssCallArg);
				if (rssResult.xml) {
					const { url, content } = rssResult.xml;
					if (content) {
						const rssFile = new URL(url.replace(/^\/?/, './'), astroConfig.dist);
						if (assets[fileURLToPath(rssFile)]) {
							throw new Error(`[getStaticPaths] RSS feed ${url} already exists.\nUse \`rss(data, {url: '...'})\` to choose a unique, custom URL. (${route.component})`);
						}
						assets[fileURLToPath(rssFile)] = content;
					}
				}
				if (rssResult.xsl?.content) {
					const { url, content } = rssResult.xsl;
					const stylesheetFile = new URL(url.replace(/^\/?/, './'), astroConfig.dist);
					if (assets[fileURLToPath(stylesheetFile)]) {
						throw new Error(
							`[getStaticPaths] RSS feed stylesheet ${url} already exists.\nUse \`rss(data, {stylesheet: '...'})\` to choose a unique, custom URL. (${route.component})`
						);
					}
					assets[fileURLToPath(stylesheetFile)] = content;
				}
			}
			const finalPaths = result.staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean);
			allPages[route.component] = {
				route,
				paths: finalPaths,
				preload: await ssrPreload({
					astroConfig,
					filePath: new URL(`./${route.component}`, astroConfig.projectRoot),
					logging,
					mode: 'production',
					origin,
					pathname: finalPaths[0],
					route,
					routeCache,
					viteServer,
				}),
			};
		})
	);

	return { assets, allPages };
}

async function getStaticPathsForRoute(opts: CollectPagesDataOptions, route: RouteData): Promise<RouteCacheEntry> {
	const { astroConfig, logging, routeCache, viteServer } = opts;
	if (!viteServer) throw new Error(`vite.createServer() not called!`);
	const filePath = new URL(`./${route.component}`, astroConfig.projectRoot);
	const mod = (await viteServer.ssrLoadModule(fileURLToPath(filePath))) as ComponentInstance;
	const result = await callGetStaticPaths(mod, route, false, logging);
	routeCache.set(route, result);
	return result;
}
