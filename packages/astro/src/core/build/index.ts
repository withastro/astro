import type { AstroConfig, BuildConfig, ManifestData } from '../../@types/astro';
import type { LogOptions } from '../logger';

import fs from 'fs';
import * as colors from 'kleur/colors';
import { apply as applyPolyfill } from '../polyfill.js';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import { createVite, ViteConfigWithSSR } from '../create-vite.js';
import { debug, defaultLogOptions, info, levels, timerMessage, warn } from '../logger.js';
import { createRouteManifest } from '../routing/index.js';
import { generateSitemap } from '../render/sitemap.js';
import { collectPagesData } from './page-data.js';
import { build as scanBasedBuild } from './scan-based-build.js';
import { staticBuild } from './static-build.js';
import { RouteCache } from '../render/route-cache.js';
import { runHookBuildDone, runHookBuildStart, runHookConfigDone, runHookConfigSetup } from '../../integrations/index.js';

export interface BuildOptions {
	mode?: string;
	logging: LogOptions;
}

/** `astro build` */
export default async function build(config: AstroConfig, options: BuildOptions = { logging: defaultLogOptions }): Promise<void> {
	const builder = new AstroBuilder(config, options);
	await builder.build();
}

class AstroBuilder {
	private config: AstroConfig;
	private logging: LogOptions;
	private mode = 'production';
	private origin: string;
	private routeCache: RouteCache;
	private manifest: ManifestData;
	private viteServer?: vite.ViteDevServer;
	private viteConfig?: ViteConfigWithSSR;

	constructor(config: AstroConfig, options: BuildOptions) {
		applyPolyfill();

		if (!config.buildOptions.site && config.buildOptions.sitemap !== false) {
			warn(options.logging, 'config', `Set "buildOptions.site" to generate correct canonical URLs and sitemap`);
		}

		if (options.mode) this.mode = options.mode;
		this.config = config;
		const port = config.devOptions.port; // no need to save this (don’t rely on port in builder)
		this.logging = options.logging;
		this.routeCache = new RouteCache(this.logging);
		this.origin = config.buildOptions.site ? new URL(config.buildOptions.site).origin : `http://localhost:${port}`;
		this.manifest = createRouteManifest({ config }, this.logging);
	}

	async build() {
		const { logging, origin } = this;
		const timer: Record<string, number> = {};
		timer.init = performance.now();
		timer.viteStart = performance.now();
		this.config = await runHookConfigSetup({ config: this.config, command: 'build' });
		const viteConfig = await createVite(
			{
				mode: this.mode,
				server: {
					hmr: false,
					middlewareMode: 'ssr',
				},
			},
			{ astroConfig: this.config, logging, mode: 'build' }
		);
		await runHookConfigDone({ config: this.config });
		this.viteConfig = viteConfig;
		const viteServer = await vite.createServer(viteConfig);
		this.viteServer = viteServer;
		debug('build', timerMessage('Vite started', timer.viteStart));
		const buildConfig: BuildConfig = { staticMode: undefined };
		await runHookBuildStart({ config: this.config, buildConfig });

		timer.loadStart = performance.now();
		const { assets, allPages } = await collectPagesData({
			astroConfig: this.config,
			logging: this.logging,
			manifest: this.manifest,
			origin,
			routeCache: this.routeCache,
			viteServer: this.viteServer,
			ssr: this.config.buildOptions.experimentalSsr,
		});

		// Filter pages by using conditions based on their frontmatter.
		Object.entries(allPages).forEach(([page, data]) => {
			if ('frontmatter' in data.preload[1]) {
				// TODO: add better type inference to data.preload[1]
				const frontmatter = (data.preload[1] as any).frontmatter;
				if (Boolean(frontmatter.draft) && !this.config.buildOptions.drafts) {
					debug('build', timerMessage(`Skipping draft page ${page}`, timer.loadStart));
					delete allPages[page];
				}
			}
		});

		debug('build', timerMessage('All pages loaded', timer.loadStart));

		// The names of each pages
		const pageNames: string[] = [];

		// Bundle the assets in your final build: This currently takes the HTML output
		// of every page (stored in memory) and bundles the assets pointed to on those pages.
		timer.buildStart = performance.now();

		// Use the new faster static based build.
		if (!this.config.buildOptions.legacyBuild) {
			await staticBuild({
				allPages,
				astroConfig: this.config,
				logging: this.logging,
				manifest: this.manifest,
				origin: this.origin,
				pageNames,
				routeCache: this.routeCache,
				viteConfig: this.viteConfig,
				buildConfig,
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
		debug('build', timerMessage('Vite build finished', timer.buildStart));

		// Write any additionally generated assets to disk.
		timer.assetsStart = performance.now();
		Object.keys(assets).map((k) => {
			if (!assets[k]) return;
			const filePath = new URL(`file://${k}`);
			fs.mkdirSync(new URL('./', filePath), { recursive: true });
			fs.writeFileSync(filePath, assets[k], 'utf8');
			delete assets[k]; // free up memory
		});
		debug('build', timerMessage('Additional assets copied', timer.assetsStart));

		// Build your final sitemap.
		if (this.config.buildOptions.sitemap && this.config.buildOptions.site) {
			timer.sitemapStart = performance.now();
			const sitemapFilter = this.config.buildOptions.sitemapFilter ? (this.config.buildOptions.sitemapFilter as (page: string) => boolean) : undefined;
			const sitemap = generateSitemap(
				pageNames.map((pageName) => new URL(pageName, this.config.buildOptions.site).href),
				sitemapFilter
			);
			const sitemapPath = new URL('./sitemap.xml', this.config.dist);
			await fs.promises.mkdir(new URL('./', sitemapPath), { recursive: true });
			await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
			debug('build', timerMessage('Sitemap built', timer.sitemapStart));
		}

		// You're done! Time to clean up.
		await viteServer.close();
		await runHookBuildDone({ config: this.config, pages: pageNames });

		if (logging.level && levels[logging.level] <= levels['info']) {
			await this.printStats({ logging, timeStart: timer.init, pageCount: pageNames.length });
		}
	}

	/** Stats */
	private async printStats({ logging, timeStart, pageCount }: { logging: LogOptions; timeStart: number; pageCount: number }) {
		const buildTime = performance.now() - timeStart;
		const total = buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
		const perPage = `${Math.round(buildTime / pageCount)}ms`;
		info(logging, 'build', `${pageCount} pages built in ${colors.bold(total)} ${colors.dim(`(${perPage}/page)`)}`);
		info(logging, 'build', `🚀 ${colors.cyan(colors.bold('Done'))}`);
	}
}
