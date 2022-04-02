import type { AstroConfig, ComponentInstance, ManifestData, RouteData } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger/core';
import { info } from '../logger/core.js';
import type { ViteDevServer } from 'vite';

import { fileURLToPath } from 'url';
import * as colors from 'kleur/colors';
import { debug } from '../logger/core.js';
import { preload as ssrPreload } from '../render/dev/index.js';
import { generateRssFunction } from '../render/rss.js';
import { callGetStaticPaths, RouteCache, RouteCacheEntry } from '../render/route-cache.js';
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
			allPages[route.component] = {
				component: route.component,
				route,
				paths: [route.pathname],
				moduleSpecifier: '',
				css: new Set(),
				hoistedScript: undefined,
				scripts: new Set(),
				preload: await ssrPreload({
					astroConfig,
					filePath: new URL(`./${route.component}`, astroConfig.root),
					viteServer,
				})
					.then((routes) => {
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
						return routes;
					})
					.catch((err) => {
						clearInterval(routeCollectionLogTimeout);
						debug('build', `├── ${colors.bold(colors.red('✘'))} ${route.component}`);
						throw err;
					}),
			};
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
		const rssFn = generateRssFunction(astroConfig.site, route);
		for (const rssCallArg of result.rss) {
			const rssResult = rssFn(rssCallArg);
			if (rssResult.xml) {
				const { url, content } = rssResult.xml;
				if (content) {
					const rssFile = new URL(url.replace(/^\/?/, './'), astroConfig.outDir);
					if (assets[fileURLToPath(rssFile)]) {
						throw new Error(
							`[getStaticPaths] RSS feed ${url} already exists.\nUse \`rss(data, {url: '...'})\` to choose a unique, custom URL. (${route.component})`
						);
					}
					assets[fileURLToPath(rssFile)] = content;
				}
			}
			if (rssResult.xsl?.content) {
				const { url, content } = rssResult.xsl;
				const stylesheetFile = new URL(url.replace(/^\/?/, './'), astroConfig.outDir);
				if (assets[fileURLToPath(stylesheetFile)]) {
					throw new Error(
						`[getStaticPaths] RSS feed stylesheet ${url} already exists.\nUse \`rss(data, {stylesheet: '...'})\` to choose a unique, custom URL. (${route.component})`
					);
				}
				assets[fileURLToPath(stylesheetFile)] = content;
			}
		}
		const finalPaths = result.staticPaths
			.map((staticPath) => staticPath.params && route.generate(staticPath.params))
			.filter(Boolean);
		allPages[route.component] = {
			component: route.component,
			route,
			paths: finalPaths,
			moduleSpecifier: '',
			css: new Set(),
			hoistedScript: undefined,
			scripts: new Set(),
			preload: await ssrPreload({
				astroConfig,
				filePath: new URL(`./${route.component}`, astroConfig.root),
				viteServer,
			}),
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
