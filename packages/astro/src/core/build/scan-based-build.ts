import type { ViteDevServer } from 'vite';
import type { AstroConfig, RouteType } from '../../@types/astro';
import type { AllPagesData, PageBuildData } from './types';
import type { LogOptions } from '../logger';
import type { ViteConfigWithSSR } from '../create-vite.js';

import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { createBuildInternals } from '../../core/build/internal.js';
import { rollupPluginAstroBuildHTML } from '../../vite-plugin-build-html/index.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import { RouteCache } from '../render/route-cache.js';

export interface ScanBasedBuildOptions {
	allPages: AllPagesData;
	astroConfig: AstroConfig;
	logging: LogOptions;
	origin: string;
	pageNames: string[];
	routeCache: RouteCache;
	viteConfig: ViteConfigWithSSR;
	viteServer: ViteDevServer;
}

// Returns a filter predicate to filter AllPagesData entries by RouteType
function entryIsType(type: RouteType) {
	return function withPage([_, pageData]: [string, PageBuildData]) {
		return pageData.route.type === type;
	};
}

// Reducer to combine AllPageData entries back into an object keyed by filepath
function reduceEntries<U>(acc: { [key: string]: U }, [key, value]: [string, U]) {
	acc[key] = value;
	return acc;
}

// Filters an AllPagesData object to only include routes of a specific RouteType
function routesOfType(type: RouteType, allPages: AllPagesData) {
	return Object.entries(allPages).filter(entryIsType(type)).reduce(reduceEntries, {});
}

export async function build(opts: ScanBasedBuildOptions) {
	const { allPages, astroConfig, logging, origin, pageNames, routeCache, viteConfig, viteServer } = opts;

	// Internal maps used to coordinate the HTML and CSS plugins.
	const internals = createBuildInternals();

	return await vite.build({
		logLevel: 'error',
		mode: 'production',
		build: {
			emptyOutDir: true,
			minify: 'esbuild', // significantly faster than "terser" but may produce slightly-bigger bundles
			outDir: fileURLToPath(astroConfig.dist),
			rollupOptions: {
				// The `input` will be populated in the build rollup plugin.
				input: [],
				output: {
					format: 'esm',
				},
			},
			target: 'es2020', // must match an esbuild target
		},
		plugins: [
			rollupPluginAstroBuildHTML({
				astroConfig,
				internals,
				logging,
				origin,
				allPages: routesOfType('page', allPages),
				pageNames,
				routeCache,
				viteServer,
			}),
			rollupPluginAstroBuildCSS({
				internals,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.buildOptions.site ? new URL(astroConfig.buildOptions.site).pathname : '/',
	});
}
