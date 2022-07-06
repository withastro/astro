import type { AstroTelemetry } from '@astrojs/telemetry';
import type { AstroConfig, BuildConfig, ManifestData } from '../../@types/astro';
import type { LogOptions } from '../logger/core';

import fs from 'fs';
import * as colors from 'kleur/colors';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import {
	runHookBuildDone,
	runHookBuildStart,
	runHookConfigDone,
	runHookConfigSetup,
} from '../../integrations/index.js';
import { createVite, ViteConfigWithSSR } from '../create-vite.js';
import { fixViteErrorMessage } from '../errors.js';
import { debug, info, levels, timerMessage, warnIfUsingExperimentalSSR } from '../logger/core.js';
import { apply as applyPolyfill } from '../polyfill.js';
import { RouteCache } from '../render/route-cache.js';
import { createRouteManifest } from '../routing/index.js';
import { createSafeError, isBuildingToSSR } from '../util.js';
import { collectPagesData } from './page-data.js';
import { staticBuild } from './static-build.js';
import { getTimeStat } from './util.js';

export interface BuildOptions {
	mode?: string;
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

/** `astro build` */
export default async function build(config: AstroConfig, options: BuildOptions): Promise<void> {
	applyPolyfill();
	const builder = new AstroBuilder(config, options);
	await builder.run();
}

class AstroBuilder {
	private config: AstroConfig;
	private logging: LogOptions;
	private mode = 'production';
	private origin: string;
	private routeCache: RouteCache;
	private manifest: ManifestData;
	private timer: Record<string, number>;

	constructor(config: AstroConfig, options: BuildOptions) {
		if (options.mode) {
			this.mode = options.mode;
		}
		this.config = config;
		this.logging = options.logging;
		this.routeCache = new RouteCache(this.logging);
		this.origin = config.site
			? new URL(config.site).origin
			: `http://localhost:${config.server.port}`;
		this.manifest = { routes: [] };
		this.timer = {};
	}

	/** Setup Vite and run any async setup logic that couldn't run inside of the constructor. */
	private async setup() {
		debug('build', 'Initial setup...');
		const { logging } = this;
		this.timer.init = performance.now();
		this.timer.viteStart = performance.now();
		this.config = await runHookConfigSetup({ config: this.config, command: 'build' });
		this.manifest = createRouteManifest({ config: this.config }, this.logging);

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
		warnIfUsingExperimentalSSR(logging, this.config);
		const viteServer = await vite.createServer(viteConfig);
		debug('build', timerMessage('Vite started', this.timer.viteStart));
		return { viteConfig, viteServer };
	}

	/** Run the build logic. build() is marked private because usage should go through ".run()" */
	private async build({
		viteConfig,
		viteServer,
	}: {
		viteConfig: ViteConfigWithSSR;
		viteServer: vite.ViteDevServer;
	}) {
		const { origin } = this;
		const buildConfig: BuildConfig = {
			client: new URL('./client/', this.config.outDir),
			server: new URL('./server/', this.config.outDir),
			serverEntry: 'entry.mjs',
			staticMode: undefined,
		};
		await runHookBuildStart({ config: this.config, buildConfig });

		info(this.logging, 'build', 'Collecting build information...');
		this.timer.loadStart = performance.now();
		const { assets, allPages } = await collectPagesData({
			astroConfig: this.config,
			logging: this.logging,
			manifest: this.manifest,
			origin,
			routeCache: this.routeCache,
			viteServer,
			ssr: isBuildingToSSR(this.config),
		});

		debug('build', timerMessage('All pages loaded', this.timer.loadStart));

		// The names of each pages
		const pageNames: string[] = [];

		// Bundle the assets in your final build: This currently takes the HTML output
		// of every page (stored in memory) and bundles the assets pointed to on those pages.
		this.timer.buildStart = performance.now();
		info(
			this.logging,
			'build',
			colors.dim(`Completed in ${getTimeStat(this.timer.init, performance.now())}.`)
		);

		await staticBuild({
			allPages,
			astroConfig: this.config,
			logging: this.logging,
			manifest: this.manifest,
			origin: this.origin,
			pageNames,
			routeCache: this.routeCache,
			viteConfig,
			buildConfig,
		});

		// Write any additionally generated assets to disk.
		this.timer.assetsStart = performance.now();
		Object.keys(assets).map((k) => {
			if (!assets[k]) return;
			const filePath = new URL(`file://${k}`);
			fs.mkdirSync(new URL('./', filePath), { recursive: true });
			fs.writeFileSync(filePath, assets[k], 'utf8');
			delete assets[k]; // free up memory
		});
		debug('build', timerMessage('Additional assets copied', this.timer.assetsStart));

		// You're done! Time to clean up.
		await viteServer.close();
		await runHookBuildDone({
			config: this.config,
			buildConfig,
			pages: pageNames,
			routes: Object.values(allPages).map((pd) => pd.route),
		});

		if (this.logging.level && levels[this.logging.level] <= levels['info']) {
			const buildMode = isBuildingToSSR(this.config) ? 'ssr' : 'static';
			await this.printStats({
				logging: this.logging,
				timeStart: this.timer.init,
				pageCount: pageNames.length,
				buildMode,
			});
		}
	}

	/** Build the given Astro project.  */
	async run() {
		const setupData = await this.setup();
		try {
			await this.build(setupData);
		} catch (_err) {
			throw fixViteErrorMessage(createSafeError(_err), setupData.viteServer);
		}
	}

	/** Stats */
	private async printStats({
		logging,
		timeStart,
		pageCount,
		buildMode,
	}: {
		logging: LogOptions;
		timeStart: number;
		pageCount: number;
		buildMode: 'static' | 'ssr';
	}) {
		const total = getTimeStat(timeStart, performance.now());

		let messages: string[] = [];
		if (buildMode === 'static') {
			messages = [`${pageCount} page(s) built in`, colors.bold(total)];
		} else {
			messages = ['Server built in', colors.bold(total)];
		}

		info(logging, 'build', messages.join(' '));
		info(logging, 'build', `${colors.bold('Complete!')}`);
	}
}
