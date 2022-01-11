import type { AstroConfig, ManifestData, RouteCache } from '../../@types/astro';
import type { LogOptions } from '../logger';

import fs from 'fs';
import * as colors from 'kleur/colors';
import { polyfill } from '@astropub/webapi';
import { performance } from 'perf_hooks';
import vite, { ViteDevServer } from '../vite.js';
import { createVite, ViteConfigWithSSR } from '../create-vite.js';
import { debug, defaultLogOptions, info, levels, timerMessage, warn } from '../logger.js';
import { createRouteManifest } from '../ssr/routing.js';
import { generateSitemap } from '../ssr/sitemap.js';
import { collectPagesData } from './page-data.js';
import { build as scanBasedBuild } from './scan-based-build.js';
import { staticBuild } from './static-build.js';

export interface BuildOptions {
	mode?: string;
	logging: LogOptions;
}

/** `astro build` */
export default async function build(config: AstroConfig, options: BuildOptions = { logging: defaultLogOptions }): Promise<void> {
	// polyfill WebAPIs to globalThis for Node v12, Node v14, and Node v16
	polyfill(globalThis, {
		exclude: 'window document',
	});

	const builder = new AstroBuilder(config, options);
	await builder.build();
}

class AstroBuilder {
	private config: AstroConfig;
	private logging: LogOptions;
	private mode = 'production';
	private origin: string;
	private routeCache: RouteCache = {};
	private manifest: ManifestData;
	private viteServer?: ViteDevServer;
	private viteConfig?: ViteConfigWithSSR;

	constructor(config: AstroConfig, options: BuildOptions) {
		if (!config.buildOptions.site && config.buildOptions.sitemap !== false) {
			warn(options.logging, 'config', `Set "buildOptions.site" to generate correct canonical URLs and sitemap`);
		}

		if (options.mode) this.mode = options.mode;
		this.config = config;
		const port = config.devOptions.port; // no need to save this (don’t rely on port in builder)
		this.logging = options.logging;
		this.origin = config.buildOptions.site ? new URL(config.buildOptions.site).origin : `http://localhost:${port}`;
		this.manifest = createRouteManifest({ config }, this.logging);
	}

	async build() {
		const { logging, origin } = this;
		const timer: Record<string, number> = {};
		timer.init = performance.now();
		timer.viteStart = performance.now();
		const viteConfig = await createVite(
			vite.mergeConfig(
				{
					mode: this.mode,
					server: {
						hmr: { overlay: false },
						middlewareMode: 'ssr',
					},
				},
				this.config.vite || {}
			),
			{ astroConfig: this.config, logging }
		);
		this.viteConfig = viteConfig;
		const viteServer = await vite.createServer(viteConfig);
		this.viteServer = viteServer;
		debug(logging, 'build', timerMessage('Vite started', timer.viteStart));

		timer.loadStart = performance.now();
		const { assets, allPages } = await collectPagesData({
			astroConfig: this.config,
			logging: this.logging,
			manifest: this.manifest,
			origin,
			routeCache: this.routeCache,
			viteServer: this.viteServer,
		});
		debug(logging, 'build', timerMessage('All pages loaded', timer.loadStart));

		// The names of each pages
		const pageNames: string[] = [];

		// Bundle the assets in your final build: This currently takes the HTML output
		// of every page (stored in memory) and bundles the assets pointed to on those pages.
		timer.buildStart = performance.now();

		// Use the new faster static based build.
		if (this.config.buildOptions.experimentalStaticBuild) {
			await staticBuild({
				allPages,
				astroConfig: this.config,
				logging: this.logging,
				origin: this.origin,
				pageNames,
				routeCache: this.routeCache,
				viteConfig: this.viteConfig,
			});
		} else {
			await scanBasedBuild({
				allPages,
				astroConfig: this.config,
				logging: this.logging,
				origin: this.origin,
				pageNames,
				routeCache: this.routeCache,
				viteConfig: this.viteConfig,
				viteServer: this.viteServer,
			});
		}
		debug(logging, 'build', timerMessage('Vite build finished', timer.buildStart));

		// Write any additionally generated assets to disk.
		timer.assetsStart = performance.now();
		Object.keys(assets).map((k) => {
			if (!assets[k]) return;
			const filePath = new URL(`file://${k}`);
			fs.mkdirSync(new URL('./', filePath), { recursive: true });
			fs.writeFileSync(filePath, assets[k], 'utf8');
			delete assets[k]; // free up memory
		});
		debug(logging, 'build', timerMessage('Additional assets copied', timer.assetsStart));

		// Build your final sitemap.
		timer.sitemapStart = performance.now();
		if (this.config.buildOptions.sitemap && this.config.buildOptions.site) {
			const sitemap = generateSitemap(pageNames.map((pageName) => new URL(`/${pageName}`, this.config.buildOptions.site).href));
			const sitemapPath = new URL('./sitemap.xml', this.config.dist);
			await fs.promises.mkdir(new URL('./', sitemapPath), { recursive: true });
			await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
		}
		debug(logging, 'build', timerMessage('Sitemap built', timer.sitemapStart));

		// You're done! Time to clean up.
		await viteServer.close();
		if (logging.level && levels[logging.level] <= levels['info']) {
			await this.printStats({ logging, timeStart: timer.init, pageCount: pageNames.length });
		}
	}

	/** Stats */
	private async printStats({ logging, timeStart, pageCount }: { logging: LogOptions; timeStart: number; pageCount: number }) {
		/* eslint-disable no-console */
		debug(logging, ''); // empty line for debug
		const buildTime = performance.now() - timeStart;
		const total = buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
		const perPage = `${Math.round(buildTime / pageCount)}ms`;
		info(logging, 'build', `${pageCount} pages built in ${colors.bold(total)} ${colors.dim(`(${perPage}/page)`)}`);
		info(logging, 'build', `🚀 ${colors.cyan(colors.bold('Done'))}`);
	}
}
