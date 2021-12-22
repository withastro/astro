import type { ViteDevServer } from '../vite.js';
import type { AstroConfig, RouteCache } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger';
import type { ViteConfigWithSSR } from '../create-vite.js';

import { fileURLToPath } from 'url';
import vite from '../vite.js';
import { createBuildInternals } from '../../core/build/internal.js';
import { rollupPluginAstroBuildHTML } from '../../vite-plugin-build-html/index.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';

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
				allPages,
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
